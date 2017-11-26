; Builds all CompileIt examples

#include <File.au3>
#include <WinAPIShPath.au3>

Global $aFiles = _FileListToArray(@ScriptDir, "*.au3", $FLTA_FILES, True)

If Not IsArray($aFiles) Then Exit
For $i = 1 To $aFiles[0]
	If StringLeft(_WinAPI_PathFindFileName($aFiles[$i]), 1) = "_" Then ContinueLoop
	ConsoleWrite("Building '"&$aFiles[$i]&"'..."&@CRLF)
	RunWait(StringFormat("""%s"" ""%s""", @ScriptDir&"\..\CompileIt.exe", $aFiles[$i]))
Next
