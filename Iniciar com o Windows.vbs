' Faz o JARVIS abrir sozinho toda vez que voce ligar o PC (cria um atalho na pasta Inicializar do Windows).
' Para abrir SEM janela (direto na bandeja), troque modo = "" por modo = " hidden" na linha abaixo.
modo = ""
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
Set sh = CreateObject("WScript.Shell")
Set lnk = sh.CreateShortcut(sh.SpecialFolders("Startup") & "\JARVIS.lnk")
lnk.TargetPath = "wscript.exe"
lnk.Arguments = """" & dir & "\Jarvis Desktop.vbs""" & modo
lnk.WorkingDirectory = dir
lnk.IconLocation = dir & "\build\icon.ico"
lnk.Description = "Abrir o JARVIS ao ligar o PC"
lnk.Save
MsgBox "Pronto: o JARVIS vai abrir sozinho quando voce ligar o PC.", 64, "JARVIS"
