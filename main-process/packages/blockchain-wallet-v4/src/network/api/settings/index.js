export default ({ securityProcess: { getSettings, updateSettings } }) => {
  const updateEmail = (guid, email) =>
    updateSettings(guid, 'update-email', email)

  const sendConfirmationCodeEmail = (guid, email) =>
    updateSettings(guid, 'send-verify-email-mail', email)

  const sendEmailConfirmation = (guid, email) =>
    updateSettings(guid, 'update-email', email)

  const resendVerifyEmail = (guid, email) =>
    updateSettings(guid, 'resend-verify-email', email)

  const verifyEmail = (guid, code) =>
    updateSettings(guid, 'verify-email-code', code)

  const updateMobile = (guid, mobile) =>
    updateSettings(guid, 'update-sms', mobile)

  const verifyMobile = (guid, code) => updateSettings(guid, 'verify-sms', code)

  const updateLanguage = (guid, language) =>
    updateSettings(guid, 'update-language', language)

  const updateCurrency = (guid, currency) =>
    updateSettings(guid, 'update-currency', currency)

  const updateLastTxTime = (guid, time) =>
    updateSettings(guid, 'update-last-tx-time', time)

  const updateLoggingLevel = (guid, loggingLevel) =>
    updateSettings(guid, 'update-logging-level', loggingLevel)

  const updateIpLock = (guid, ipLock) =>
    updateSettings(guid, 'update-ip-lock', ipLock)

  const updateIpLockOn = (guid, ipLockOn) =>
    updateSettings(guid, 'update-ip-lock-on', ipLockOn)

  const updateBlockTorIps = (guid, blockTorIps) =>
    updateSettings(guid, 'update-block-tor-ips', blockTorIps)

  const updateHint = (guid, hint) =>
    updateSettings(guid, 'update-password-hint1', hint)

  const updateAuthType = (guid, authType) =>
    updateSettings(guid, 'update-auth-type', authType)

  const updateAuthTypeNeverSave = (guid, authTypeNeverSave) =>
    updateSettings(guid, 'update-never-save-auth-type', authTypeNeverSave)

  const getGoogleAuthenticatorSecretUrl = guid =>
    updateSettings(guid, 'generate-google-secret', '')

  const enableGoogleAuthenticator = (guid, code) =>
    updateSettings(guid, 'update-auth-type', '4', `code=${code}`)

  const enableYubikey = (guid, code) =>
    updateSettings(guid, 'update-yubikey', code)

  const enableNotifications = (guid, value) =>
    updateSettings(guid, 'update-notifications-on', value)

  const updateNotificationsType = (guid, value) =>
    updateSettings(guid, 'update-notifications-type', value)

  return {
    getSettings,
    updateEmail,
    sendEmailConfirmation,
    resendVerifyEmail,
    verifyEmail,
    updateMobile,
    verifyMobile,
    updateLanguage,
    updateLastTxTime,
    updateCurrency,
    updateLoggingLevel,
    updateIpLock,
    updateIpLockOn,
    updateBlockTorIps,
    updateHint,
    updateAuthType,
    updateAuthTypeNeverSave,
    getGoogleAuthenticatorSecretUrl,
    enableGoogleAuthenticator,
    enableYubikey,
    sendConfirmationCodeEmail,
    enableNotifications,
    updateNotificationsType
  }
}
