/* Optional standalone storage: never enable it implicitly. */
(function(root){
  'use strict';
  function hasSaved(keys) {
    try { return keys.some(key => localStorage.getItem(key) !== null); }
    catch (_) { return false; }
  }
  function confirmLocalSave(keys) {
    return root.confirm(hasSaved(keys)
      ? 'START LOCAL SAVE? This will REPLACE the previous saved draft and Evidence Ledger for this technique with what is currently on screen. Choose Cancel to preserve your older copy and stay Private. Use OPEN SAVED DRAFT first if you want to recover it.'
      : 'START LOCAL SAVE? This draft and Evidence Ledger will now auto-save in this browser on this device. Continue?');
  }
  function showRestore(button, keys, privateMode) {
    if (button) button.hidden = !privateMode || !hasSaved(keys);
  }
  root.ProblemMePrivateDefault = {hasSaved,confirmLocalSave,showRestore};
})(window);
