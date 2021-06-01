# cockpit-certificates

A certificate management plugin for [Cockpit](https://cockpit-project.org/)

## Technologies

- cockpit-certificates communicates with [certmonger](https://www.freeipa.org/page/Certmonger) through its D-Bus API.

# Automated release

Releases are automated using [Cockpituous release](https://github.com/cockpit-project/cockpituous/tree/master/release)
which aims to fully automate project releases to GitHub, Fedora, Ubuntu, COPR, Docker
Hub, and other places. The intention is that the only manual step for releasing
a project is to create a signed tag for the version number.

The release steps are controlled by the
[cockpituous-release](./cockpituous-release) script.

Pushing the release tag triggers the [release.yml](.github/workflows/release.yml)
[GitHub action](https://github.com/features/actions) workflow. This uses the
[cockpit-project organization secrets](https://github.com/organizations/cockpit-project/settings/secrets).

# Automated maintenance

It is important to keep your [NPM modules](./package.json) up to date, to keep
up with security updates and bug fixes. This is done with the
[npm-update bot script](https://github.com/cockpit-project/bots/blob/master/npm-update)
which is run weekly or upon [manual request](https://github.com/skobyda/cockpit-certificates/actions) through the
[npm-update.yml](.github/workflows/npm-update.yml) [GitHub action](https://github.com/features/actions).

# Running tests in CI
Tests run in [Packit](https://packit.dev/) for all currently supported
Fedora releases; see the [packit.yaml](./packit.yaml) control file. You need to
[enable Packit-as-a-service](https://packit.dev/docs/packit-as-a-service/) in your GitHub project to use this.
To run the tests in the exact same way for upstream pull requests and for
[Fedora package update gating](https://docs.fedoraproject.org/en-US/ci/), the
tests are wrapped in the [FMF metadata format](https://github.com/psss/fmf)
for using with the [tmt test management tool](https://docs.fedoraproject.org/en-US/ci/tmt/).
Note that Packit tests can *not* run their own virtual machine images, thus
they only run [@nondestructive tests](https://github.com/martinpitt/cockpit/blob/master/test/common/testlib.py).
