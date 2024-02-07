# Hacking on Cockpit Certificates

Here's where to get the code:

    $ git clone https://github.com/skobyda/cockpit-certificates
    $ cd cockpit-certificates

The remainder of the commands assume you're in the top level of the
Cockpit Certificates git repository checkout.

## Running eslint

Cockpit Certificates uses [ESLint](https://eslint.org/) to automatically check
JavaScript code style in `.jsx` and `.js` files.

eslint is executed as part of `test/static-code`, aka. `make codecheck`.

For developer convenience, the ESLint can be started explicitly by:

    $ npm run eslint

Violations of some rules can be fixed automatically by:

    $ npm run eslint:fix

Rules configuration can be found in the `.eslintrc.json` file.

## Running stylelint

Cockpit uses [Stylelint](https://stylelint.io/) to automatically check CSS code
style in `.css` and `scss` files.

styleint is executed as part of `test/static-code`, aka. `make codecheck`.

For developer convenience, the Stylelint can be started explicitly by:

    $ npm run stylelint

Violations of some rules can be fixed automatically by:

    $ npm run stylelint:fix

Rules configuration can be found in the `.stylelintrc.json` file.
