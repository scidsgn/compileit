Global $i

For $i = 1 To 100
	ConsoleWrite("Is ")
	ConsoleWrite($i)
	ConsoleWrite(" prime? ")
	ConsoleWrite(IsPrime($i))
	ConsoleWrite(@CRLF)
Next

Func IsPrime($a)
	Local $i
	If $a < 2 Then Return False
	For $i = 2 To ($a-1)
		If Mod($a, $i) = 0 Then Return False
	Next
	Return True
EndFunc
