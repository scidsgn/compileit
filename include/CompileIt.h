#ifndef __ComplexIT_h__
#define __ComplexIT_h_

#include <stdbool.h>
#include <wchar.h>

typedef enum VariantType {
    AU3_VT_NULL = 0,
    AU3_VT_BOOL = 1,
    AU3_VT_NUMBER = 2,
    AU3_VT_INT = 3,
    AU3_VT_STRING = 4,
    AU3_VT_HANDLE = 5
} vt_type;

typedef struct Variant {
    vt_type type;
    int *data_ptr;
} variant, *p_variant;

/* Variant creation functions */
variant null_variant(void);
variant number_variant(double num);
variant int_variant(int num);
variant bool_variant(bool state);
variant string_variant(wchar_t *str);

/* Accessing variant values */
double variant_getnumber(variant vt);
bool variant_getboolean(variant vt);
wchar_t *variant_getstring(variant vt);

/* Variant utilities */
variant clone_variant(variant vt);
void free_variant(variant vt);

/* Variant operators */
variant op_equal(variant vt1, variant vt2);
variant op_nequal(variant vt1, variant vt2);
variant op_dblequal(variant vt1, variant vt2);
variant op_greater(variant vt1, variant vt2);
variant op_greatereq(variant vt1, variant vt2);
variant op_less(variant vt1, variant vt2);
variant op_lesseq(variant vt1, variant vt2);

variant op_add(variant vt1, variant vt2);
variant op_subtract(variant vt1, variant vt2);
variant op_multiply(variant vt1, variant vt2);
variant op_divide(variant vt1, variant vt2);
variant op_exp(variant vt1, variant vt2);

variant op_and(variant vt1, variant vt2);
variant op_or(variant vt1, variant vt2);
variant op_not(variant vt);

variant op_concat(variant vt1, variant vt2);

variant op_ternary(variant cond, variant vt1, variant vt2);

/* Variant assignment */
void variant_assign(p_variant to, variant from);
void variant_assignadd(p_variant to, variant from);
void variant_assignsub(p_variant to, variant from);
void variant_assignmul(p_variant to, variant from);
void variant_assigndiv(p_variant to, variant from);
void variant_assignconcat(p_variant to, variant from);

/* AutoIt functions */
variant macro_getvalue(char *name);

void au3_consolewrite(variant vt);

variant au3_stringlen(variant vt);
variant au3_stringreverse(variant vt);
variant au3_stringcompare(variant vt1, variant vt2);

variant au3_sin(variant vt);
variant au3_cos(variant vt);
variant au3_tan(variant vt);
variant au3_asin(variant vt);
variant au3_acos(variant vt);
variant au3_atan(variant vt);
variant au3_mod(variant vt1, variant vt2);
variant au3_sqrt(variant vt);
variant au3_log(variant vt);
variant au3_exp(variant vt);
variant au3_abs(variant vt);
variant au3_ceiling(variant vt);
variant au3_floor(variant vt);
variant au3_round(variant vt);

#endif // __ComplexIT_h__
