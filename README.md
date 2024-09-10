# GDScript Formatter & Linter

This extension should help aspiring GDScript/Godot developers to develop within VSCode with features like linting and formatting.

It is based on prior work by [Chris Kuhn](https://github.com/kuhnchris).

## Features

- Linting via gdlint
- Document formatting with gdformat

## Requirements

Requires python3 (pip3) and the "gdtoolkit" accessable in PATH.

Install via: **python -m pip install gdtoolkit** or equivalent command.

See also: https://pypi.org/project/gdtoolkit/

## GDLint Configuration

The option for max-line-length is only applicable to `gdformat`.
To adjust the max-line-length of `gdlint`, you must generate a .gdlintrc file by running the command `gdlint -d` then rename the created file from `gdlintrc` to `.gdlintrc`

## Other Notes

It's highly recommended to use the [Error Lens](https://marketplace.visualstudio.com/items?itemName=usernamehw.errorlens) plugin alongside this one, for inline display of problems.

## Release Notes

See CHANGELOG.md

## License

See License.txt
