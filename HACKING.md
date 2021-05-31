# Hacking on Cockpit Certificates

Here's where to get the code:

    $ git clone https://github.com/skobyda/cockpit-certificates
    $ cd cockpit-certificates

The remainder of the commands assume you're in the top level of the
Cockpit Certificates git repository checkout.

## Running eslint

Cockpit Certificates uses [ESLint](https://eslint.org/) to automatically check
JavaScript code style in `.jsx` and `.js` files.

The linter is executed within every build as a webpack preloader.

For developer convenience, the ESLint can be started explicitly by:

    $ npm run eslint

Violations of some rules can be fixed automatically by:

    $ npm run eslint:fix

Rules configuration can be found in the `.eslintrc.json` file.
