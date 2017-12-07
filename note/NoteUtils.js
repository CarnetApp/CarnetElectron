var NoteUtils = function() {

}
NoteUtils.getNoteRelativePath = function(rootPath, notePath) {
    return notePath.substring(rootPath.length+1)
}