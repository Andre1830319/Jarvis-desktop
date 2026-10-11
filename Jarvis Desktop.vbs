' Abre o JARVIS Desktop sem terminal (duplo clique). Erros vao para jarvis_desktop_start.txt na pasta acima.
' Com o argumento "hidden" o app abre direto na bandeja (sem janela), com a voz e a transmissao ja funcionando.
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
Set sh = CreateObject("WScript.Shell")
sh.CurrentDirectory = dir
extra = ""
If WScript.Arguments.Count > 0 Then
  If LCase(WScript.Arguments(0)) = "hidden" Then extra = " -- --hidden"
End If
sh.Run "cmd /c npm start" & extra & " > """ & fso.GetParentFolderName(dir) & "\jarvis_desktop_start.txt"" 2>&1", 0, False
