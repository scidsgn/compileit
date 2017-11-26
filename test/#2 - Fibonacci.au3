ConsoleWrite("The 15th Fibonacci number is equal to ")
ConsoleWrite(Fibonacci(15))

Func Fibonacci($n)
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
