' Cria o atalho "JARVIS" na Area de Trabalho e no Menu Iniciar (digite JARVIS na busca do Windows).
' Tecla de atalho: CTRL+ALT+J abre o JARVIS se ele nao estiver aberto, ou traz a janela para frente se ja estiver.
' Se o JARVIS ja esta rodando, abrir de novo NAO duplica nada: so mostra a janela.
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
Set sh = CreateObject("WScript.Shell")
destinos = Array(sh.SpecialFolders("Desktop"), sh.SpecialFolders("Programs"))
For Each d In destinos
  Set lnk = sh.CreateShortcut(d & "\JARVIS.lnk")
  lnk.TargetPath = "wscript.exe"
  lnk.Arguments = """" & dir & "\Jarvis Desktop.vbs"""
  lnk.WorkingDirectory = dir
  lnk.IconLocation = dir & "\build\icon.ico"
  lnk.Description = "Abrir o JARVIS (se ja estiver aberto, mostra a janela)"
  lnk.WindowStyle = 7
  lnk.Hotkey = "CTRL+ALT+J"
  lnk.Save
Next
MsgBox "Atalhos JARVIS criados (Area de Trabalho e Menu Iniciar)." & vbCrLf & "Tecla de atalho: CTRL+ALT+J", 64, "JARVIS"
