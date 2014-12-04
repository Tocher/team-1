Team1.Header = function (app) {
  this.app = app

  new Switchery(document.querySelector('.js-switch'))

  this.getThemesList()

  this.changeEditorMode()

  this.getDefaultEditorMode()
}


Team1.Header.prototype.getThemesList = function () {
  var self = this

  $.get("/theme", function (data) {
    self.themesList = JSON.parse(data)
  }).done(function () {
    self.setThemesList()
  })
}

Team1.Header.prototype.setThemesList = function () {
  var $themesList = $(".control__themelist")

  this.themesList.forEach(function (theme) {
    $themesList.append("<option>" + theme.slice(0, -4) + "</option>")
  })

  $("body").append("<style class='theme_style'>")

  this.addHandlerToThemeOption()
}

Team1.Header.prototype.addHandlerToThemeOption = function () {
  var self = this
    , theme
    , $themesList = $(".control__themelist")

  $themesList.on("change", function () {
    theme = $(this).find("option:selected").text()

    self.setTheme(theme)
  })
}

Team1.Header.prototype.setTheme = function (theme) {
  var self = this

  $.get("/theme", {name: theme})
    .done(function (data) {
      $(".theme_style").text(JSON.parse(data))
      self.app.Editor.codeEditor.setOption("theme", theme)
    }).fail(function () {
      console.log("Error downloading theme")
    })
}

Team1.Header.prototype.changeEditorMode = function () {
  var $header = $(".header")
    , $roster = $(".roster")

  $(".js-editor-mode-switch").on("change", function () {
    if ($(this).is(":checked")) {
      $header.removeClass("header--dark").addClass("header--light")
      $roster.removeClass("roster--dark").addClass("roster--light")
    } else {
      $header.removeClass("header--light").addClass("header--dark")
      $roster.removeClass("roster--light").addClass("roster--dark")
    }
  })
}

Team1.Header.prototype.getDefaultEditorMode = function () {
  var editorMode = "light" //light or dark

  this.setDefaultEditorMode(editorMode);
}
Team1.Header.prototype.setDefaultEditorMode = function (editorMode) {
  var $header = $(".header")
    , $roster = $(".roster")
    , $switchMode = $(".js-editor-mode-switch")

  $header.addClass("header--" + editorMode)
  $roster.addClass("roster--" + editorMode)

  if (editorMode == "light") {
    // $switchMode.prop("checked", true) // don't work
    $switchMode.click();
  }
}
