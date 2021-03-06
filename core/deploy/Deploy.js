module.exports = (function () {
    'use strict'

    const $watch = require('node-watch');
    const $fs = require('fs');
    const $go = require('./../class/lang/go.js');
    const $ecma6 = require('./../class/lang/ecma6.js');
    const $ecma5 = require('./../class/lang/ecma5.js');
    const $services = require('./bootstrap/services/lang/ecma6.js');
    const $containers = require('./bootstrap/containers/lang/ecma6.js');
    const $deamons = require('./bootstrap/deamons/lang/ecma6.js');
    const $repertory = new (require('./../tools/files.js'))();

    require('./../tools/string.js');

    const REGEX = {
        js: "^(.*).js$",
        go: "^(.*).go",
    }

    return class Deploy {
        constructor(target, bootstrap) {
            if (!target)
                throw "1";
            else
            if (typeof target !== "string")
                throw "1 type";
            if (!bootstrap)
                throw "2";
            else
            if (typeof bootstrap !== "string")
                throw "2 type";
            try {
                if (!$fs.existsSync(bootstrap.slice(0, bootstrap.lastIndexOf("/") + 1))) {
                    throw("path is not found");
                }
            } catch (err) {
                throw err;
            }
            switch (target) {
                case "es6":
                    break;
                case "es5":
                    break;
                default:
                    throw ("error type " + target + " is not in charge");
            }
            this.bootstrap = bootstrap;
            this.target = target;
            this.str = "";
            this.cycle = [];
        }

        static getClassName(filename, type) {
            
            if (!REGEX[type])
                throw ("error type " + type + " is not in charge");
            var className = new RegExp(REGEX[type], "g").exec(filename);
            if (!className) {
                throw("error type " + type + " and file " + filename + " not match")
            }
            return className[1];
        }

        autoload(container) {
            
            let directory = container.src, namespace = container.name, restrict = container.restrict;
            namespace = "/" + namespace.replace(/\\/g, "_").replace(/\\\\/g, "_").trim() + "/";
            return new Promise((resolve, reject) => {
                let innerClass;
                $repertory.src(this.path + "/" + directory).then((e) => {
                    e.map((file) => {
                        switch (this.target) {
                            case "es6":
                                var fn = Deploy.getClassName(file.name, "js");
                                innerClass = new $ecma6(fn, file.content);
                                this.str += `register('${namespace}').class('${innerClass.funcName}', class {\n${innerClass.inner()}}\n,${JSON.stringify(innerClass.reflect.constructor.args)});\n`;
                                break;
                            case "es5":
                                var fn = Deploy.getClassName(file.name, "js");
                                innerClass = new $ecma5(fn, file.content);
                                this.str += `register('${namespace}').class('${innerClass.funcName}', function(){\n${innerClass.inner()}\n return ${innerClass.funcName} \n;}(),${JSON.stringify(innerClass.reflect.constructor.args)});\n`;
                                break;
                            default:
                                throw "error";
                                break;
                        }


                    })
                    resolve( );
                });
            })
            
        }
        build(path, mapping) {

            var containers = new $containers(mapping);
            var services = new $services(mapping);
            var deamons = new $deamons(mapping);
            var cycle = [];

            for (var i in containers.container) {
                cycle.push(containers.container[i]);
            }
            for (var i in services.service) {
                cycle.push(services.service[i]);
            }
            for (var i in deamons.deamon) {
                cycle.push(deamons.deamon[i]);
            }
            this.path = path;
            this.cycle = cycle;
            return new Promise((resolve, reject) => {
                containers.build().then((value) => {
                    this.str = value;
                    this.compile().then(() => {
                       this.write().then(function(){
                            resolve();
                       }).catch(function(err){
                            reject(err);
                       });
                    }).catch(function(err){
                        reject(err);
                    })
                });
            });
        }

        compile() {
            let limit = this.cycle.length;
            function* thread() {
                var index = 0;
                while (index < limit - 1) {
                    yield index++;
                }
            }
            let iterator = thread();
            return new Promise((resolve, reject) => {
                  
                for (var index in this.cycle) {
                    try{
                    
                        this.autoload(this.cycle[index]).then(() => {
                            iterator.next().done === true && (resolve());
                        }).catch((err) =>{
                         
                             reject(err);
                        });
                    }catch (err){
                        reject(err);
                    }
                }
            });
        }

        write() {
            return new Promise((resolve, reject) => {
                $fs.writeFile(this.bootstrap, this.str,  (error) =>{
                   this.str = "";
                    if (error) {
                       reject("write error:  " + error.message);
                    } else {
                       resolve("completed");
                    }
                })
            });
        }

        watch() {
            for (var i in this.cycle) {
                var watcher = $watch('./' + this.cycle[i].src);
                watcher.on('change', () => {
                    this.compile();
                });
            }
        }

    }

})();