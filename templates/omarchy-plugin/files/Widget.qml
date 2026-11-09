import QtQuick

Item {
  implicitWidth: label.implicitWidth
  implicitHeight: label.implicitHeight

  Text {
    id: label
    textFormat: Text.PlainText
    text: "__NAME__"
  }
}
