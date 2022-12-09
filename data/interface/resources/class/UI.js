var UI = {
  "PreventPasteFor": function (target) {
    target.addEventListener("paste", function (e) {
      e.preventDefault();
    });
  },
  "EditableBlur": function (target, callback) {
    target.addEventListener("blur", function () {
      if (callback !== undefined) callback(target.textContent);
      /*  */
      target.dataset.value = target.textContent.toString();
      target.textContent = ("00" + target.textContent).slice(-2);
    });
  },
  "SelectAllText": function (target) {
    const select = window.getSelection();
    const range = document.createRange();
    /*  */
    range.selectNodeContents(target);
    select.removeAllRanges();
    select.addRange(range);
  },
  "EditableKeypress": function (target) {
    target.addEventListener("keypress", function (e) {
      if (e.keyCode === 32 || e.keyCode === 13) e.preventDefault();
      /*  */
      if (isNaN(String.fromCharCode(e.which))) e.preventDefault();
      else if (target.textContent.length > 1) {
        var selection = window.getSelection().toString();
        if (selection.length === 2) target.textContent = '';
        else e.preventDefault();
      }
    });
  }
};
