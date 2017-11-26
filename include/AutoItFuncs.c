#include <stdlib.h>
#include <stdbool.h>
#include <stdio.h>
#include <string.h>
#include <math.h>

#include "CompileIT.h"

variant macro_getvalue(char *name) {
    if (strcmp(name, "crlf") == 0)
        return string_variant(L"\n");
    if (strcmp(name, "compiled") == 0)
        return bool_variant(true);
    return null_variant();
}

void au3_consolewrite(variant vt) {
    if (vt.type == AU3_VT_NUMBER) {
        printf("%.15f", variant_getnumber(vt));
    } else if (vt.type == AU3_VT_INT) {
        printf("%d", (int)variant_getnumber(vt));
    } else if (vt.type == AU3_VT_BOOL) {
        printf("%s", variant_getboolean(vt) ? "True" : "False");
    } else if (vt.type == AU3_VT_STRING) {
        wprintf((wchar_t*)vt.data_ptr);
    }
}

variant au3_stringlen(variant vt) {
    if (vt.type != AU3_VT_STRING)
        return int_variant(0);
    return int_variant(wcslen(vt.data_ptr));
}

variant au3_stringreverse(variant vt) {
    if (vt.type != AU3_VT_STRING)
        return null_variant();
    return string_variant(wcsrev(vt.data_ptr));
}

variant au3_stringcompare(variant vt1, variant vt2) {
    if (vt1.type != AU3_VT_STRING || vt2.type != AU3_VT_STRING)
        return null_variant();
    return int_variant(wcscmpi(vt1.data_ptr, vt2.data_ptr));
}

variant au3_sin(variant vt) {
    if (vt.type == AU3_VT_NUMBER || vt.type == AU3_VT_INT) {
		return number_variant(sin(variant_getnumber(vt)));
    }
	return number_variant(0.0);
}

variant au3_cos(variant vt) {
    if (vt.type == AU3_VT_NUMBER || vt.type == AU3_VT_INT) {
		return number_variant(cos(variant_getnumber(vt)));
    }
	return number_variant(0.0);
}

variant au3_tan(variant vt) {
    if (vt.type == AU3_VT_NUMBER || vt.type == AU3_VT_INT) {
		return number_variant(tan(variant_getnumber(vt)));
    }
	return number_variant(0.0);
}

variant au3_asin(variant vt) {
    if (vt.type == AU3_VT_NUMBER || vt.type == AU3_VT_INT) {
		return number_variant(asin(variant_getnumber(vt)));
    }
	return number_variant(0.0);
}

variant au3_acos(variant vt) {
    if (vt.type == AU3_VT_NUMBER || vt.type == AU3_VT_INT) {
		return number_variant(acos(variant_getnumber(vt)));
    }
	return number_variant(0.0);
}

variant au3_atan(variant vt) {
    if (vt.type == AU3_VT_NUMBER || vt.type == AU3_VT_INT) {
		return number_variant(atan(variant_getnumber(vt)));
    }
	return number_variant(0.0);
}

variant au3_mod(variant vt1, variant vt2) {
    if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_NUMBER) {
        double num = fmod(variant_getnumber(vt1), variant_getnumber(vt2));
        return number_variant(num);
    } else if (vt1.type == AU3_VT_NUMBER && vt2.type == AU3_VT_INT) {
        double num = fmod(variant_getnumber(vt1), (double)variant_getnumber(vt2));
        return number_variant(num);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_NUMBER) {
        double num = fmod((double)variant_getnumber(vt1), variant_getnumber(vt2));
        return number_variant(num);
    } else if (vt1.type == AU3_VT_INT && vt2.type == AU3_VT_INT) {
        int num = (int)fmod((double)variant_getnumber(vt1), (double)variant_getnumber(vt2));
        return int_variant(num);
    }

    return number_variant(0.0);
}

variant au3_sqrt(variant vt) {
    if (vt.type == AU3_VT_NUMBER || vt.type == AU3_VT_INT) {
		return number_variant(sqrt(variant_getnumber(vt)));
    }
	return number_variant(0.0);
}

variant au3_exp(variant vt) {
    if (vt.type == AU3_VT_NUMBER || vt.type == AU3_VT_INT) {
		return number_variant(exp(variant_getnumber(vt)));
    }
	return number_variant(0.0);
}

variant au3_log(variant vt) {
    if (vt.type == AU3_VT_NUMBER || vt.type == AU3_VT_INT) {
		return number_variant(log(variant_getnumber(vt)));
    }
	return number_variant(0.0);
}

variant au3_abs(variant vt) {
    if (vt.type == AU3_VT_NUMBER) {
        double num = variant_getnumber(vt);
		return number_variant((num < 0.0) ? -num : num);
    } else if (vt.type == AU3_VT_INT) {
        int num = (int)variant_getnumber(vt);
		return int_variant((num < 0) ? -num : num);
    }
	return number_variant(0.0);
}

variant au3_ceiling(variant vt) {
    if (vt.type == AU3_VT_NUMBER) {
        double num = ceil(variant_getnumber(vt));
		return number_variant(num);
    } else if (vt.type == AU3_VT_INT) {
        int num = (int)ceil(variant_getnumber(vt));
		return int_variant(num);
    }
	return number_variant(0.0);
}

variant au3_floor(variant vt) {
    if (vt.type == AU3_VT_NUMBER) {
        double num = floor(variant_getnumber(vt));
		return number_variant(num);
    } else if (vt.type == AU3_VT_INT) {
        int num = (int)floor(variant_getnumber(vt));
		return int_variant(num);
    }
	return number_variant(0.0);
}

variant au3_round(variant vt) {
    if (vt.type == AU3_VT_NUMBER) {
        double num = round(variant_getnumber(vt));
		return number_variant(num);
    } else if (vt.type == AU3_VT_INT) {
        int num = (int)round(variant_getnumber(vt));
		return int_variant(num);
    }
	return number_variant(0.0);
}
