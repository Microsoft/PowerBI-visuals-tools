############### Utility functions ###############
libraryRequireInstall = function(packageName, ...)
{
  if(!require(packageName, character.only = TRUE)) 
    warning(paste("*** The package: '", packageName, "' was not installed ***", sep=""))
}

libraryRequireInstall("XML")
libraryRequireInstall("htmlwidgets")

internalSaveWidget <- function(widget, fname)
{
  tempFname = paste(fname, ".tmp", sep="")
  htmlwidgets::saveWidget(widget, file = tempFname, selfcontained = FALSE)
  FlattenHTML(tempFname, fname)
}

FlattenHTML <- function(fnameIn, fnameOut)
{
  # Read and parse HTML file
  # Embed all js and css files into one unified file
  
  if(!file.exists(fnameIn))
    return(FALSE)
  
  dir = dirname(fnameIn)
  html = htmlTreeParse(fnameIn, useInternal = TRUE)
  top = xmlRoot(html)
  
  # extract all <script> tags with src value
  srcNode=getNodeSet(top, '//script[@src]')
  for (node in srcNode)
  {
    b = xmlAttrs(node)
    fname = file.path(dir, b['src'])
    alternateSrc = FindSrcReplacement(fname)
    if (!is.null(alternateSrc))
    {
      s = alternateSrc
      names(s) = 'src'
      newNode = xmlNode("script",attrs = s)
      replaceNodes(node, newNode)
    }else{
      str=ReadFileForEmbedding(fname);
      if (!is.null(str))
      {      
        newNode = xmlNode("script", str, attrs = c(type = "text/javascript"))
        replaceNodes(node, newNode)
      }
    }
  }
  
  # extract all <link> tags with src value
  linkNode=getNodeSet(top, '//link[@href]')
  for (node in linkNode)
  {
    b = xmlAttrs(node)
    fname = file.path(dir, b['href'])
    str = ReadFileForEmbedding(fname, FALSE);
    if (!is.null(str))
    {
      newNode = xmlNode("style", str)
      replaceNodes(node, newNode)
    }
  }
  
  saveXML(html, file = fnameOut)
  return(TRUE)
}

ReadFileForEmbedding <- function(fname, addCdata = TRUE)
{
  data = ReadFullFile(fname)
  if (is.null(data))
    return(NULL)

  str = paste(data, collapse ='\n')
  if (addCdata) {
    str = paste(cbind('// <![CDATA[', str,'// ]]>'), collapse ='\n')
  }
  return(str)
}

ReadFullFile <- function(fname)
{
  if(!file.exists(fname))
    return(NULL)
  
  con = file(fname, open = "r")
  data = readLines(con)
  close(con)
  return(data)
}

FindSrcReplacement <- function(str)
{
  # finds reference to 'plotly' js and replaces with a version from CDN
  # This allows the HTML to be smaller, since this script is not fully embedded in it
  str <- iconv(str, to="UTF-8")
  pattern = "plotly-(\\w.+)/plotly-latest.min.js"
  match1=regexpr(pattern, str)
  attr(match1, 'useBytes') <- FALSE
  strMatch=regmatches(str, match1, invert = FALSE)
  if (length(strMatch) == 0) return(NULL)
  
  pattern2 = "-(\\d.+)/"
  match2 = regexpr(pattern2, strMatch[1])
  attr(match2, 'useBytes') <- FALSE
  strmatch = regmatches(strMatch[1], match2)
  if (length(strmatch) == 0) return(NULL)
  
  # CDN url is https://cdn.plot.ly/plotly-<Version>.js
  # This matches the specific version used in the plotly package used.
  verstr = substr(strmatch, 2, nchar(strmatch)-1)
  str = paste('https://cdn.plot.ly/plotly-', verstr,'.min.js', sep='')
  return(str)
}

ReadFullFileReplaceString <- function(fnameIn, fnameOut, sourceString,targetString) {
  # Replaces texts in file
  # This makes it possible to replace e.g. paddings in the generated html widget code
  if(!file.exists(fnameIn))
    return(NULL)
  tx  <- readLines(fnameIn,encoding = "UTF-8")
  tx2  <- gsub(pattern = sourceString, replace = targetString, x = tx)
  writeLines(tx2, con = fnameOut)
}
#################################################
