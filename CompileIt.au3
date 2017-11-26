#include <ChakraCore.au3>
#include <WinAPIShPath.au3>
#include <Array.au3>

Global $sLibraryPath = @ScriptDir & "\lib\libCompileITLib.a"

Global $aCSourceFiles = ["CompileIt.c", "AutoItFuncs.c"]
Global $bIsDll = False

Global $sInputScriptFile = @ScriptDir & "\test\test.au3"

; compiles the transpiler
ShellExecuteWait(@ScriptDir&"\transpiler\merge.au3", "", @ScriptDir&"\transpiler")

_ChakraCore_Startup()

; Create runtime and context objects
Global $hRuntime = _ChakraCore_CreateRuntime(0)
Global $hContext = _ChakraCore_CreateContext($hRuntime)

Global $sGccPath = "gcc"

; Set the current execution context
_ChakraCore_SetCurrentContext($hContext)

; Get the global object (basically everything belongs to it)
Global $hGlobalObj = _ChakraCore_GetGlobalObject()

; Create console.log
;_ConsoleLog
Global $hConsoleLog = _ChakraCore_CreateFunction("_ConsoleLog")
Global $hConsoleObj = _ChakraCore_CreateObject()
_ChakraCore_SetProperty($hConsoleObj, _ChakraCore_GetPropertyIdFromName("log"), $hConsoleLog)
_ChakraCore_SetProperty($hGlobalObj, _ChakraCore_GetPropertyIdFromName("console"), $hConsoleObj)

; Execute!
$hOutput = _ChakraCore_RunScript(FileRead(@ScriptDir&"\transpiler\main.c.js"), 0)
ConsoleWrite($hOutput)

Global $hCallback = _ChakraCore_CreateFunction("_IncludeCallback")

Global $hCompileFunc = $hOutput

_ConvertAu3File($sInputScriptFile)
_CompileCFiles()
_LinkAll()

; Clean up
_ChakraCore_DisposeRuntime($hRuntime)

_ChakraCore_Shutdown()

Func _ExceptionCheck()
	$aCall = DllCall($__g_hChakraCoreDll, "dword", "JsGetAndClearException", "handle*", 0)
	$hExc = $aCall[1]

	ConsoleWrite(_ChakraCore_GetString(_ChakraCore_GetProperty($hExc, _ChakraCore_GetPropertyIdFromName("stack"))))
EndFunc

Func _ConvertAu3File($sFile)
	Local $aArgs = [_ChakraCore_CreateString(FileRead($sInputScriptFile)), _ChakraCore_CreateString("test"), _ChakraCore_CreateString("CompileIt.h"), $hCallback]

	Local $hOutputObj = _ChakraCore_CallFunction($hCompileFunc, $aArgs)
;~ 	_ExceptionCheck()

	Local $hCode = _ChakraCore_GetProperty($hOutputObj, _ChakraCore_GetPropertyIdFromName("code"))
	Local $sCode = _ChakraCore_GetString($hCode)

	Local $hHeader = _ChakraCore_GetProperty($hOutputObj, _ChakraCore_GetPropertyIdFromName("headers"))
	Local $sHeader = _ChakraCore_GetString($hHeader)

	Local $hDllCode = _ChakraCore_GetProperty($hOutputObj, _ChakraCore_GetPropertyIdFromName("dll_code"))
	Local $sDllCode = _ChakraCore_GetString($hDllCode)

	Local $hDllHeader = _ChakraCore_GetProperty($hOutputObj, _ChakraCore_GetPropertyIdFromName("dll_header"))
	Local $sDllHeader = _ChakraCore_GetString($hDllHeader)

	Local $hIsDll = _ChakraCore_GetProperty($hOutputObj, _ChakraCore_GetPropertyIdFromName("is_dll"))
	Local $isDll = _ChakraCore_GetNumber($hIsDll)

	If $isDll Then
		$sDLLCodeFileName = _WinAPI_PathRenameExtension($sFile, "_dll.c")
		FileOverwrite($sDLLCodeFileName, $sDllCode)
		$sHeaderFileName = _WinAPI_PathRenameExtension($sFile, "_dll.h")
		FileOverwrite($sHeaderFileName, $sDllHeader)

		_ArrayAdd($aCSourceFiles, $sDLLCodeFileName)

		$bIsDll = True
	EndIf

	$sCodeFileName = _WinAPI_PathRenameExtension($sFile, ".c")
	FileOverwrite($sCodeFileName, $sCode)

	$sHeaderFileName = _WinAPI_PathRenameExtension($sFile, ".h")
	FileOverwrite($sHeaderFileName, $sHeader)

	_ArrayAdd($aCSourceFiles, $sCodeFileName)
EndFunc

Func _CompileCFiles()
	Local $sOutput = _WinAPI_PathRenameExtension($sInputScriptFile, $bIsDll ? ".dll" : ".exe")
	Local $sRunStr = StringFormat('"%s" -O3 -o "%s" "%s" ', $sGccPath, _WinAPI_PathFindFileName($sOutput), $sLibraryPath)

	If $bIsDll Then
		$sRunStr &= "-DBUILD_DLL -shared -luser32 "
	EndIf

	For $file In $aCSourceFiles
		$sObjFile = _WinAPI_PathRenameExtension($file, ".o")

		$sRunStr &= '"'& _WinAPI_PathFindFileName($file) &'" '
	Next

	ConsoleWrite($sRunStr)
	RunWait($sRunStr, _WinAPI_PathRemoveFileSpec($file))
EndFunc

Func _LinkAll()
EndFunc

Func FileOverwrite($sPath, $sData)
	$hFile = FileOpen($sPath, 2)
	FileWrite($hFile, $sData)
	FileClose($hFile)
EndFunc

Func _IncludeCallback($hCallee, $bIsConstructCall, $pArguments, $iArgCount, $pCallbackState)
	Local $tArgs = DllStructCreate("ptr args["&$iArgCount&"]", $pArguments)
	Local $sIncludeFile = _ChakraCore_GetString($tArgs.args(2))
	Local $iIncludeMode = _ChakraCore_GetNumber($tArgs.args(3))
	Local $bIncludeIsC = _ChakraCore_GetNumber($tArgs.args(4))

	If $bIncludeIsC Then
		ConsoleWrite("C include detected: "&$sIncludeFile&@CRLF)
	Else
		ConsoleWrite("AutoIt include detected: "&$sIncludeFile&@CRLF)
	EndIf
EndFunc

Func _ConsoleLog($hCallee, $bIsConstructCall, $pArguments, $iArgCount, $pCallbackState)
	Local $tArgs = DllStructCreate("ptr args["&$iArgCount&"]", $pArguments)
	Local $sString = _ChakraCore_GetString($tArgs.args(2))

	ConsoleWrite("+> JS: "&$sString&@CRLF)
EndFunc
