Func Fibonacci($n)
; Exposes the function in a DLL.
; Syntax: return_type dll_function_name(argument_type1, argument_type2, ...)
#DllExport int dll_Fibonacci(int)
	Local $a = 1, $b = 1, $c
	Local $i

	If $n = 1 Or $n = 2 Then Return 1
	For $i = 3 To $n
		$c = $b
		$b += $a
		$a = $c
	Next

	Return $b
EndFunc
