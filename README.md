# United Storage (US)

United Storage is part of [DataLens](https://datalens.tech) that provides universal API for storing, updating and retrieving various configuration objects.

## Getting started

```sh
npm ci
npm run dev
```

[More details](https://github.com/datalens-tech/datalens)

## Комментарий
Для интеграции с [datalens-auth](https://github.com/akrasnov87/datalens-auth) требуется передать переменную `NODE_RPC_URL` со значением адреса сервера, например
<pre>
NODE_RPC_URL=http://localhost:7000/demo/rpc
</pre>

Пример отправляемого запроса:
<pre>
{"url":"/v1/collection-content?includePermissionsInfo=true&pageSize=50&orderField=createdAt&orderDirection=desc&onlyMy=false&mode=all","method":"GET","rawHeaders":["Accept","application/json, */*","x-request-id","dl.95099.8f2fd60e","host","host.docker.internal:8030","accept-encoding","gzip, deflate","accept-language","en","x-gateway-version","1.5.1","x-forwarded-for","172.22.0.1","x-rpc-authorization","bW9iaWxlOjEyMzQ1","user-agent","Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 YaBrowser/24.1.0.0 Safari/537.36","origin","http://localhost:8080","referer","http://localhost:8080/collections?x-rpc-authorization=bW9iaWxlOjEyMzQ1","Connection","close"]}
</pre>

__Примечание__: для некоторых контейнеров введена маркеровка с буквой `a`. Эта буква обозначает сборку, которую окончательно ещё не проверяли, либо она промежуточная.

## Сборка
<pre>
docker login -u [username]
docker build -t akrasnov87/datalens-us:0.214.0 .
docker push akrasnov87/datalens-us:0.214.0
</pre>

## Тестирование

В корне проекта создать файл .env и добавить туда строки:
<pre>
HC=1
POSTGRES_DSN_LIST=postgres://us:us@127.0.0.1:5432/us-db-ci_purgeable
APP_PORT=3030
NODE_RPC_URL=http://localhost:7000/demo/rpc
PROJECT_ID=datalens-demo

### TEMPLATE SECRETS BEGIN
APP_INSTALLATION=opensource
APP_ENV=development

MASTER_TOKEN=development-master-token
CONTROL_MASTER_TOKEN=development-control-master-token

US_SURPRESS_DB_STATUS_LOGS=true

### TEMPLATE SECRETS END
</pre>

Создать файл .env.development и оставить его пустым

И выполнить: 
<pre>
npm ci
npm run dev
</pre>

### Описание параметров
* PROJECT_ID - идентификатор проекта, по которому будет фильтр в таблицах piblic.workbooks и public.collections
* NODE_RPC_URL - имя сервиса для разграничения прав доступа

__Внимание__: если требуется отладка [datalens-backend](https://github.com/akrasnov87/datalens-backend), то нужно чтобы `MASTER_TOKEN`(ы) совпадали. 

## Получение последних изменений

<pre>
git remote add upstream https://github.com/datalens-tech/datalens-us.git
git pull upstream main
</pre>

## Проверка соединения с БД

Подключаемся через docker exec и в терминале выполняем команду из документации по [postgres](https://postgrespro.ru/docs/postgresql/9.6/app-pg-isready)

## vscode

Создаём launch файл
<pre>
{
    // Use IntelliSense to learn about possible attributes.
    // Hover to view descriptions of existing attributes.
    // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Launch via npm",
            "type": "node",
            "request": "launch",
            "cwd": "${workspaceFolder}",
            "runtimeExecutable": "npm",
            "runtimeArgs": ["run", "dev"]
        }
    ]
}
</pre>