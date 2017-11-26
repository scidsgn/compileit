#NoTrayIcon
#pragma compile(Out, CompileItCmd.exe)
#pragma compile(Icon, icon.ico)
#pragma compile(UPX, false)
#pragma compile(Compatibility, win7)
#pragma compile(CompanyName, scintilla4evr)
#pragma compile(FileDescription, "CompileIt Command Line Utility")
#pragma compile(FileVersion, 0.0.1.0)
#pragma compile(FileDescription, "CompileIt")
#pragma compile(FileVersion, 0.0.1.0)
#pragma compile(x64, false)
#pragma compile(Console, true)

#include <AutoItConstants.au3>

If $CmdLine[0] = 0 Or $CmdLine[1] = "/help" Then
	ConsoleWrite("Usage: CompileItCmd.exe ""file""")
	Exit
EndIf

$iCITPid = Run(StringFormat('"%s" "%s"', @ScriptDir&"\CompileIt", $CmdLine[1]), @WorkingDir, @SW_HIDE, $STDOUT_CHILD)

While ProcessExists($iCITPid)
	$sRead = StdoutRead($iCITPid)
	If @extended > 0 Then
		ConsoleWrite($sRead)
	EndIf
WEnd