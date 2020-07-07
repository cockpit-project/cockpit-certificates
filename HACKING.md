This is a plugin for cockpit.
Install cockpit according to https://cockpit-project.org/running.html

Pull the repository and compile:
```sh
$ git clone https://github.com/skobyda/cockpit-certificates.git
$ cd cockpit-certificates
$ make
```

This project is based on cockpit's [starter-kit](https://github.com/cockpit-project/starter-kit).
For development, run your module straight out of the git tree:
```sh
$ mkdir -p ~/.local/share/cockpit
$ ln -s `pwd`/dist ~/.local/share/cockpit/certificates
```
