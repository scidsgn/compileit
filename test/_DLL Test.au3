Global $hDLL = DllOpen(@ScriptDir&"\#3 - Fibonacci DLL.dll")

Global $aCall = DllCall($hDLL, "int:cdecl", "dll_Fibonacci", "int", 15)
If @error Then Exit ConsoleWrite("Something is wrong...")
ConsoleWrite("The 15th Fibonacci number, according to the DLL, is equal to "&$aCall[0])

DllClose($hDLL)