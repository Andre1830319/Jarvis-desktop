' Desfaz o "Iniciar com o Windows".
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("WScript.Shell")
f = sh.SpecialFolders("Startup") & "\JARVIS.lnk"
If fso.FileExists(f) Then
  fso.DeleteFile f
  MsgBox "Removido. O JARVIS nao abre mais sozinho.", 64, "JARVIS"
Else
  MsgBox "O JARVIS nao estava na inicializacao.", 64, "JARVIS"
End If
