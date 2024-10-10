module.exports = {
    "env": {
        "browser": true,
        "es2021": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:react/recommended"
    ],
    "overrides": [
        {
            "env": {
                "node": true
            },
            "files": [
                ".eslintrc.{js,cjs}"
            ],
            "parserOptions": {
                "sourceType": "script"
            }
        }
    ],
    "parserOptions": {
        "ecmaVersion": "latest",
        "sourceType": "module"
    },
    "plugins": [
        "react"
    ],
    "rules": {
        "react/jsx-uses-react": "off",
        "react/react-in-jsx-scope": "off",
        "react/prop-types": "off",
        "react/no-unknown-property": "off",
        "no-unused-vars": "warn",
        "no-undef": "warn",
        "getter-return": "off",
        "max-len": ["off", {
            "code": 120,
            "tabWidth": 2,
            "comments": 120,
            "ignoreComments": true,
            "ignoreTrailingComments": true,
            "ignoreUrls": true,
            "ignoreStrings": true,
            "ignoreTemplateLiterals": true,
            "ignoreRegExpLiterals": true
        }]
    },
    "globals": {
        "_czc": true,
        "process": true,
        "window._env_": true,
    },
    "ignorePatterns": ["src/render/*",
        "src/rodinrender/viewer/Xiamotracer.umd.js",
        "src/rodinrender/viewer/Xiamotracer.es.js"],
}
