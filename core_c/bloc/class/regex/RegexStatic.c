#include <stdio.h>

int RegexStatic(struct sequenceRegex * this,int(f) (struct sequenceRegex *)) {

    // REGEX STATIC Start at 115
    if (!nextCharIs(this,116)) {
        return 0;
    }
    if (!nextCharIs(this,97)) {
        return 0;
    }
    if (!nextCharIs(this,116)) {
        return 0;
    }
    if (!nextCharIs(this,105)) {
        return 0;
    }
    if (!nextCharIs(this,99)) {
        return 0;
    }
    ///////////

    if (!nextCharInline(this)) {
        return 0;
    }
    return f(this);
}