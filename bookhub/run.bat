@echo off
echo ========================================
echo    INICIANDO BOOKHUB APPLICATION
echo ========================================
echo.

REM Verificar se estamos na pasta certa
if not exist "pom.xml" (
    echo ERRO: Arquivo pom.xml nao encontrado!
    echo Certifique-se de executar este arquivo da pasta raiz do projeto.
    pause
    exit /b 1
)

REM Verificar se Maven Wrapper existe
if exist "mvnw.cmd" (
    echo Usando Maven Wrapper...
    call mvnw.cmd clean spring-boot:run
) else (
    echo Maven Wrapper nao encontrado.
    echo Verificando Maven instalado no sistema...

    REM Verificar se Maven esta instalado
    mvn --version >nul 2>&1
    if errorlevel 1 (
        echo.
        echo ERRO: Maven nao encontrado no sistema!
        echo.
        echo Solucoes:
        echo 1. Instale o Maven: https://maven.apache.org
        echo 2. Ou use o IntelliJ para executar
        echo.
        pause
        exit /b 1
    )

    echo Maven encontrado. Executando...
    mvn clean spring-boot:run
)

pause