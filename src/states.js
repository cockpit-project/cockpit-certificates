/*
 * This file is part of Cockpit.
 *
 * Copyright (C) 2020 Red Hat, Inc.
 *
 * Cockpit is free software; you can redistribute it and/or modify it
 * under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation; either version 2.1 of the License, or
 * (at your option) any later version.
 *
 * Cockpit is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with Cockpit; If not, see <http://www.gnu.org/licenses/>.
 */

import cockpit from "cockpit";

const _ = cockpit.gettext;

// States description copied from $man getcert-list
export const certificateStates = {
    NEED_KEY_PAIR: _("The service is about to generate a new key pair"),
    GENERATING_KEY_PAIR: _("The service is currently generating a new key pair"),
    NEED_KEY_GEN_PERMS: _("The service encountered a filesystem permission error while attempting to save the newly-generated key pair"),
    NEED_KEY_GEN_PIN: _("The service is missing the PIN which is required to access an NSS database in order to save the newly-generated key pair, or it has an incorrect PIN for a database"),
    NEED_KEY_GEN_TOKEN: _("The service was unable to find a suitable token to use for generating the new key pair"),
    HAVE_KEY_PAIR: _("The service has successfully generated a new key pair"),
    NEED_KEYINFO: _("The service needs to read information about the key pair"),
    READING_KEYINFO: _("The service is currently reading information about the key pair"),
    NEED_KEYINFO_READ_PIN: _("The service is missing the PIN which is required to access an NSS database in order to read information about the newly-generated key pair, or it has an incorrect PIN for a database, or has an incorrect password for accessing a key stored in encrypted PEM format"),
    NEED_KEYINFO_READ_TOKEN: _("The service was unable to find the token in which the key pair is supposed to be stored"),
    HAVE_KEYINFO: _("The service has successfully read information about the key pair"),
    NEED_CSR: _("The service is about to generate a new signing request"),
    GENERATING_CSR: _("The service is generating a signing request"),
    NEED_CSR_GEN_PIN: _("The service is missing the PIN which is required to access an NSS database in order to use the key pair, or it has an incorrect PIN for a database, or has an incorrect password for reading a key stored in encrypted PEM format"),
    NEED_CSR_GEN_TOKEN: _("The service was unable to find the token in which the key pair is supposed to be stored"),
    HAVE_CSR: _("The service has successfully generated a signing request"),
    NEED_SCEP_DATA: _("The service is about to generate data specifically needed for connecting to a CA using SCEP"),
    GENERATING_SCEP_DATA: _("The service is generating data specifically needed for connecting to a CA using SCEP"),
    NEED_SCEP_GEN_PIN: _("The service is missing the PIN which is required to access an NSS database in order to use the key pair, or it has an incorrect PIN for a database, or has an incorrect password for reading a key stored in encrypted PEM format"),
    NEED_SCEP_GEN_TOKEN: _("The service was unable to find the token in which the key pair is supposed to be stored"),
    NEED_SCEP_ENCRYPTION_CERT: _("The service is waiting until it can retrieve a copy of the CA's certificate before it can generate data required for connecting to the CA using SCEP"),
    NEED_SCEP_RSA_CLIENT_KEY: _("The CA should be contacted using SCEP, but SCEP requires the client key pair to be an RSA key pair, and it is not"),
    HAVE_SCEP_DATA: _("The service has successfully generated data for use in SCEP"),
    NEED_TO_SUBMIT: _("The service is about to submit a signing request to a CA for signing"),
    SUBMITTING: _("The service is currently submitting a signing request to a CA for signing"),
    NEED_CA: _("The service can't submit a request to a CA because it doesn't know which CA to use"),
    CA_UNREACHABLE: _("The service was unable to contact the CA, but it will try again later"),
    CA_UNCONFIGURED: _("The service is missing configuration which will be needed in order to successfully contact the CA"),
    CA_REJECTED: _("The CA rejected the signing request"),
    CA_WORKING: _("The CA has not yet approved or rejected the request. The service will check on the status of the request later."),
    NEED_TO_SAVE_CERT: _("The CA approved the signing request, and the service is about to save the issued certificate to the location where it has been told to save it"),
    PRE_SAVE_CERT: _("The service is running a configured pre-saving command before saving the newly-issued certificate to the location where it has been told to save it"),
    START_SAVING_CERT: _("The service is starting to save the issued certificate to the location where it has been told to save it"),
    SAVING_CERT: _("The service is attempting to save the issued certificate to the location where it has been told to save it"),
    NEED_CERTSAVE_PERMS: _("The service encountered a filesystem permission error while attempting to save the newly-issued certificate to the location where it has been told to save it"),
    NEED_CERTSAVE_TOKEN: _("The service is unable to find the token in which the newly-issued certificate is to be stored"),
    NEED_CERTSAVE_PIN: _("The service is missing the PIN which is required to access an NSS database in order to save the newly-issued certificate to the location where it has been told to save it"),
    NEED_TO_SAVE_CA_CERTS: _("The service is about to save the certificate of the issuing CA to the locations where it has been told to save them"),
    START_SAVING_CA_CERTS: _("The service is starting to save the certificate of the issuing CA to the locations where it has been told to save them"),
    SAVING_CA_CERTS: _("The service is saving the certificate of the issuing CA to the locations where it has been told to save them"),
    NEED_TO_SAVE_ONLY_CA_CERTS: _("The service is about to save the certificate of the issuing CA to the locations where it has been told to save them"),
    START_SAVING_ONLY_CA_CERTS: _("The service is starting to save the certificate of the issuing CA to the locations where it has been told to save them"),
    SAVING_ONLY_CA_CERTS: _("The service is saving the certificate of the issuing CA to the locations where it has been told to save them"),
    NEED_CA_CERT_SAVE_PERMS: _("NEED_ONLY_CA_CERT_SAVE_PERMS The service encountered a filesystem permission error while attempting to save the certificate of the issuing CA to the locations where it has been told to save them"),
    NEED_TO_READ_CERT: _("The service is about to read the issued certificate from the location where it has been told to save it"),
    READING_CERT: _("The service is reading the issued certificate from the location where it has been told to save it"),
    SAVED_CERT: _("The service has finished finished saving the issued certificate and the issuer's certificate to the locations where it has been told to save them"),
    POST_SAVED_CERT: _("The service is running a configured post-saving command after saving the newly-issued certificate to the location where it has been told to save them"),
    MONITORING: _("The service is monitoring the certificate and waiting for its not-valid-after date to approach. This is expected to be the status most often seen."),
    NEED_TO_NOTIFY_VALIDITY: _("The service is about to notify the system administrator that the certificate's not-valid-after date is approaching"),
    NOTIFYING_VALIDITY: _("The service is notifying the system administrator that the certificate's not-valid-after date is approaching"),
    NEED_TO_NOTIFY_REJECTION: _("The service is about to notify the system administrator that the CA rejected the signing request"),
    NOTIFYING_REJECTION: _("The service is notifying the system administrator that the CA rejected the signing request"),
    NEED_TO_NOTIFY_ISSUED_SAVE_FAILED: _("The service is needs to notify the system administrator that the CA issued a certificate, but that there was a problem saving the certificate to the location where the service was told to save it"),
    NOTIFYING_ISSUED_SAVE_FAILED: _("The service is is notifying the system administrator that the CA issued a certificate, but that there was a problem saving the certificate to the location where the service was told to save it"),
    NEED_TO_NOTIFY_ISSUED_CA_SAVE_FAILED: _("The service is needs to notify the system administrator that the CA issued a certificate, and the issued certificate was saved to the location where the service has been told to save it, but that there was a problem saving the CA's certificate to the locations where the service was told to save it"),
    NOTIFYING_ISSUED_CA_SAVE_FAILED: _("The service is notifying the system administrator that the CA issued a certificate, and the issued certificate was saved to the location where the service has been told to save it, but that there was a problem saving the CA's certificate to the locations where the service was told to save it"),
    NEED_TO_NOTIFY_ISSUED_SAVED: _("The service is needs to notify the system administrator that the CA issued a certificate and it has been saved to the location where the service has been told to save it"),
    NOTIFYING_ISSUED_SAVED: _("The service is notifying the system administrator that the CA issued a certificate and it has been saved to the location where the service has been told to save it"),
    NEED_TO_NOTIFY_ONLY_CA_SAVE_FAILED: _("The service needs to notify the system administrator that there was a problem saving the CA's certificates to the specified location"),
    NOTIFYING_ONLY_CA_SAVE_FAILED: _("The service is notifying the system administrator that there was a problem saving the CA's certificates to the specified location"),
    NEED_GUIDANCE: _("An unhandled error was encountered while attempting to contact the CA, or there is the service has just been told to monitor a certificate which does not exist and for which it has no location specified for storing a key pair that could be used to generate a signing request to obtain one"),
    NEWLY_ADDED: _("The service has just been told to track a certificate, or to generate a signing request to obtain one"),
    NEWLY_ADDED_START_READING_KEYINFO: _("The service has just been told to track a certificate, or to generate a signing request to obtain one, and is about to check if there is already a key pair present"),
    NEWLY_ADDED_READING_KEYINFO: _("The service has just been told to track a certificate, or to generate a signing request to obtain one, and is checking if there is already a key pair present"),
    NEWLY_ADDED_NEED_KEYINFO_READ_PIN: _("The service has just been told to track a certificate, or to generate a signing request to obtain one, and was unable to check if a key pair was present because it is missing the PIN which is required to access an NSS database, or because it has an incorrect PIN for a database"),
    NEWLY_ADDED_NEED_KEYINFO_READ_TOKEN: _("The service has just been told to track a certificate, or to generate a signing request to obtain one, and was unable to check if a key pair was present because the token which should be used for storing the key pair is not present"),
    NEWLY_ADDED_START_READING_CERT: _("The service has just been told to track a certificate, or to generate a signing request to obtain one, and is about to check if a certificate is already present in the specified location"),
    NEWLY_ADDED_READING_CERT: _("The service has just been told to track a certificate, or to generate a signing request to obtain one, and is checking if a certificate is already present in the specified location"),
    NEWLY_ADDED_DECIDING: _("The service has just been told to track a certificate, or to generate a signing request to obtain one, and is determining its next course of action"),
};
