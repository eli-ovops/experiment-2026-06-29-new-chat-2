export function isAllowed(message, access) {
  if (access.allowedChatIds.size > 0 && !access.allowedChatIds.has(message.chatid)) {
    return false;
  }
  if (access.allowedUserIds.size > 0 && !access.allowedUserIds.has(message.userid)) {
    return false;
  }
  return true;
}
