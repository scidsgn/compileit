#include <stdlib.h>
#include <stdio.h>
#include <math.h>

#include "CompileIT.h"

/* Variant creation functions */
variant null_variant() {
    variant out;
    out.type = AU3_VT_NULL;
    out.data_ptr = NULL;

    return out;
}

variant number_variant(double num) {
    variant out;
    double *pnum = malloc(sizeof(pnum));
    *pnum = num;

    out.type = AU3_VT_NUMBER;
    out.data_ptr = (int*)pnum;

    return out;
}

variant int_variant(int num) {
    variant out;
    int *pnum = malloc(sizeof(pnum));
    *pnum = num;

    out.type = AU3_VT_INT;
    out.data_ptr = (int*)pnum;

    return out;
}

variant bool_variant(bool state) {
    variant out;
    bool *pnum = malloc(sizeof(pnum));
    *pnum = state;

    out.type = AU3_VT_BOOL;
    out.data_ptr = (int*)pnum;

    return out;
}

variant string_variant(wchar_t *str) {
    variant out;
    wchar_t *pstr = malloc(sizeof(wchar_t)*(wcslen(str)+1));
    wcscpy(pstr, str);
    out.type = AU3_VT_STRING;
    out.data_ptr = (int*)pstr;
    return out;
}

variant handle_variant(void *ptr) {
    variant out;
    out.type = AU3_VT_HANDLE;
    out.data_ptr = (int*)ptr;
    return out;
}

/* Accessing variant values */
double variant_getnumber(variant vt) {
    if (vt.type == AU3_VT_NUMBER) {
        return *((double*)vt.data_ptr);
    } else if (vt.type == AU3_VT_INT) {
        return (double)(*vt.data_ptr);
    }
    return 0.d;
}

bool variant_getboolean(variant vt) {
	if (vt.type == AU3_VT_NUMBER || vt.type == AU3_VT_INT) {
		return (variant_getnumber(vt) == 0) ? false : true;
	} else if (vt.type == AU3_VT_BOOL) {
		return *((bool*)vt.data_ptr);
	}
	return false;
}

wchar_t *variant_getstring(variant vt) {
	if (vt.type == AU3_VT_STRING) {
        return *((wchar_t*)vt.data_ptr);
	}
	return false;
}

int *variant_gethandle(variant vt) {
	if (vt.type == AU3_VT_HANDLE) {
        return vt.data_ptr;
	}
	return false;
}

/* Variant utilities */
variant clone_variant(variant vt) {
    switch (vt.type) {
    case AU3_VT_NULL:
        return null_variant();
    case AU3_VT_NUMBER:
        return number_variant(*((double*)vt.data_ptr));
    case AU3_VT_INT:
        return int_variant(*vt.data_ptr);
    case AU3_VT_BOOL:
        return bool_variant(*((bool*)vt.data_ptr));
    case AU3_VT_STRING:
        return string_variant((wchar_t*)vt.data_ptr);
    case AU3_VT_HANDLE:
        return handle_variant(vt.data_ptr); // Handles are not cloned.
    }

    return null_variant();
}

void free_variant(variant vt) {
    free(vt.data_ptr);
}

/* Variant operators */
variant op_equal(variant vt1, variant vt2) {
    if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_NUMBER) {
        double num = variant_getnumber(vt1)-variant_getnumber(vt2);
        return bool_variant((num == 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_INT) {
        double num = variant_getnumber(vt1)-(double)variant_getnumber(vt2);
        return bool_variant((num == 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_NUMBER) {
        double num = (double)variant_getnumber(vt1)-variant_getnumber(vt2);
        return bool_variant((num == 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_INT) {
        int num = (int)(variant_getnumber(vt1)-variant_getnumber(vt2));
        return bool_variant((num == 0) ? true : false);
    }

    return bool_variant(false);
}

variant op_nequal(variant vt1, variant vt2) {
    return op_not(op_equal(vt1, vt2));
}

variant op_dblequal(variant vt1, variant vt2) {
    return op_equal(vt1, vt2);
}

variant op_greater(variant vt1, variant vt2) {
    if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_NUMBER) {
        double num = variant_getnumber(vt1)-variant_getnumber(vt2);
        return bool_variant((num > 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_INT) {
        double num = variant_getnumber(vt1)-(double)variant_getnumber(vt2);
        return bool_variant((num > 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_NUMBER) {
        double num = (double)variant_getnumber(vt1)-variant_getnumber(vt2);
        return bool_variant((num > 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_INT) {
        int num = (int)(variant_getnumber(vt1)-variant_getnumber(vt2));
        return bool_variant((num > 0) ? true : false);
    }

    return bool_variant(false);
}

variant op_greatereq(variant vt1, variant vt2) {
    if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_NUMBER) {
        double num = variant_getnumber(vt1)-variant_getnumber(vt2);
        return bool_variant((num >= 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_INT) {
        double num = variant_getnumber(vt1)-(double)variant_getnumber(vt2);
        return bool_variant((num >= 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_NUMBER) {
        double num = (double)variant_getnumber(vt1)-variant_getnumber(vt2);
        return bool_variant((num >= 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_INT) {
        int num = (int)(variant_getnumber(vt1)-variant_getnumber(vt2));
        return bool_variant((num >= 0) ? true : false);
    }

    return bool_variant(false);
}

variant op_less(variant vt1, variant vt2) {
    if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_NUMBER) {
        double num = variant_getnumber(vt1)-variant_getnumber(vt2);
        return bool_variant((num < 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_INT) {
        double num = variant_getnumber(vt1)-(double)variant_getnumber(vt2);
        return bool_variant((num < 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_NUMBER) {
        double num = (double)variant_getnumber(vt1)-variant_getnumber(vt2);
        return bool_variant((num < 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_INT) {
        int num = (int)(variant_getnumber(vt1)-variant_getnumber(vt2));
        return bool_variant((num < 0) ? true : false);
    }

    return bool_variant(false);
}

variant op_lesseq(variant vt1, variant vt2) {
    if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_NUMBER) {
        double num = variant_getnumber(vt1)-variant_getnumber(vt2);
        return bool_variant((num <= 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_INT) {
        double num = variant_getnumber(vt1)-(double)variant_getnumber(vt2);
        return bool_variant((num <= 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_NUMBER) {
        double num = (double)variant_getnumber(vt1)-variant_getnumber(vt2);
        return bool_variant((num <= 0.0) ? true : false);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_INT) {
        int num = (int)(variant_getnumber(vt1)-variant_getnumber(vt2));
        return bool_variant((num <= 0) ? true : false);
    }

    return bool_variant(false);
}

variant op_add(variant vt1, variant vt2) {
    if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_NUMBER) {
        double num = variant_getnumber(vt1)+variant_getnumber(vt2);
        return number_variant(num);
    } else if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_INT) {
        double num = variant_getnumber(vt1)+(double)variant_getnumber(vt2);
        return number_variant(num);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_NUMBER) {
        double num = (double)variant_getnumber(vt1)+variant_getnumber(vt2);
        return number_variant(num);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_INT) {
        int num = (int)(variant_getnumber(vt1)+variant_getnumber(vt2));
        return int_variant(num);
    }

    return null_variant();
}

variant op_subtract(variant vt1, variant vt2) {
    if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_NUMBER) {
        double num = variant_getnumber(vt1)-variant_getnumber(vt2);
        return number_variant(num);
    } else if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_INT) {
        double num = variant_getnumber(vt1)-(double)variant_getnumber(vt2);
        return number_variant(num);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_NUMBER) {
        double num = (double)variant_getnumber(vt1)-variant_getnumber(vt2);
        return number_variant(num);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_INT) {
        int num = (int)(variant_getnumber(vt1)-variant_getnumber(vt2));
        return int_variant(num);
    }

    return null_variant();
}

variant op_multiply(variant vt1, variant vt2) {
    if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_NUMBER) {
        double num = variant_getnumber(vt1)*variant_getnumber(vt2);
        return number_variant(num);
    } else if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_INT) {
        double num = variant_getnumber(vt1)*(double)variant_getnumber(vt2);
        return number_variant(num);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_NUMBER) {
        double num = (double)variant_getnumber(vt1)*variant_getnumber(vt2);
        return number_variant(num);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_INT) {
        int num = (int)(variant_getnumber(vt1)*variant_getnumber(vt2));
        return int_variant(num);
    }

    return null_variant();
}

variant op_divide(variant vt1, variant vt2) {
    if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_NUMBER) {
        double num = variant_getnumber(vt1)/variant_getnumber(vt2);
        return number_variant(num);
    } else if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_INT) {
        double num = variant_getnumber(vt1)/(double)variant_getnumber(vt2);
        return number_variant(num);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_NUMBER) {
        double num = (double)variant_getnumber(vt1)/variant_getnumber(vt2);
        return number_variant(num);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_INT) {
        int num = (int)(variant_getnumber(vt1)/variant_getnumber(vt2));
        return int_variant(num);
    }

    return null_variant();
}

variant op_exp(variant vt1, variant vt2) {
    if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_NUMBER) {
        double num = pow(variant_getnumber(vt1), variant_getnumber(vt2));
        return number_variant(num);
    } else if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_INT) {
        double num = pow(variant_getnumber(vt1), (double)variant_getnumber(vt2));
        return number_variant(num);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_NUMBER) {
        double num = pow((double)variant_getnumber(vt1), variant_getnumber(vt2));
        return number_variant(num);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_INT) {
        int num = (int)pow((double)variant_getnumber(vt1), (double)variant_getnumber(vt2));
        return int_variant(num);
    }

    return null_variant();
}

variant op_and(variant vt1, variant vt2) {
    return bool_variant(variant_getboolean(vt1) && variant_getboolean(vt2));
}

variant op_or(variant vt1, variant vt2) {
    return bool_variant(variant_getboolean(vt1) || variant_getboolean(vt2));
}

variant op_not(variant vt) {
    return bool_variant(!variant_getboolean(vt));
}

variant op_concat(variant vt1, variant vt2) {
    return string_variant(L"");
}

variant op_ternary(variant cond, variant vt1, variant vt2) {
    if (variant_getboolean(cond))
        return vt1;
    return vt2;
}

/* Variant assignment */
void variant_assign(p_variant to, variant from) {
    variant clone = clone_variant(from);

    free_variant(*to);
    to->type = clone.type;
    to->data_ptr = clone.data_ptr;
}

void variant_assignadd(p_variant to, variant from) {
    variant vt = op_add(*to, from);

    free_variant(*to);
    to->type = vt.type;
    to->data_ptr = vt.data_ptr;
}

void variant_assignsub(p_variant to, variant from) {
    variant vt = op_subtract(*to, from);

    free_variant(*to);
    to->type = vt.type;
    to->data_ptr = vt.data_ptr;
}

void variant_assignmul(p_variant to, variant from) {
    variant vt = op_multiply(*to, from);

    free_variant(*to);
    to->type = vt.type;
    to->data_ptr = vt.data_ptr;
}

void variant_assigndiv(p_variant to, variant from) {
    variant vt = op_divide(*to, from);

    free_variant(*to);
    to->type = vt.type;
    to->data_ptr = vt.data_ptr;
}

void variant_assignconcat(p_variant to, variant from) {
    // TODO
}
