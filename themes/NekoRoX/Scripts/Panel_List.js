// ====================================== //
// @name "List Panel (01.April.2014)" 
// @author "eXtremeHunter"
// ====================================== //
//window.DlgCode = DLGC_WANTALLKEYS;//uncomment for DUI
var rowsInGroup = window.GetProperty("user.Rows In Group", 4);
if (rowsInGroup < 0) {
    rowsInGroup = 0;
    window.SetProperty("user.Rows In Group", 0);
}
var rowH = window.GetProperty("user.Row Height", 20);
rowH = 40;
//--->
var minRowH = 10;
if (rowH < minRowH) {
    rowH = minRowH;
    window.SetProperty("user.Row Height", minRowH);
}
//--->
var scrollStep = window.GetProperty("user.Scroll Step", 3);
if (scrollStep < 1) {
    scrollStep = 1;
    window.SetProperty("user.Scroll Step", 1);
}
//--->
var listLeft = window.GetProperty("user.List Left", 15);
var listTop = window.GetProperty("user.List Top", 15);
var listRight = window.GetProperty("user.List Right", 15);
var listBottom = window.GetProperty("user.List Bottom", 15);
var scrollbarRight = window.GetProperty("user.Scrollbar Right", 15);
var showPlayCount = window.GetProperty("user.Show Play Count", componentPlayCount ? true : false);
var showRating = window.GetProperty("user.Show Rating", componentPlayCount ? true : false);
var showAlbumArt = window.GetProperty("user.Show Album Art", true);
var autoAlbumArt = window.GetProperty("user.Auto Album Art", false);
var showGroupInfo = window.GetProperty("user.Show Group Info", true);
var showGroupHeader = window.GetProperty("user.Show Group Header", true);
var showFocusItem = window.GetProperty("user.Show Focus Item", false);
var showQueueItem = window.GetProperty("user.Show Queue Item", true);

var gArtist = "%album artist%";
var gArtistAlbum = "%album artist%%album%";
var gArtistAlbumDiscnumber = "%album artist%%album%%discnumber%";
var gPath = "$directory_path(%path%)";
var gDate = "%date%";
var gUserDefined = window.GetProperty("user.GroupBy", "");
var groupFormat = window.GetProperty("system.GroupBy", gArtistAlbumDiscnumber);
var groupedID = window.GetProperty("system.GroupedID", 3);
if(groupedID == 5){
groupFormat = gUserDefined;
window.SetProperty("system.GroupBy", groupFormat);
}

var autoExpandCollapseGroups = window.GetProperty("user.Auto Expand/Collapse Groups", false);
var alternateRowColor = window.GetProperty("user.Alternate Row Color", false);
var skipLessThan = window.GetProperty("user.Skip Less Than", 2);
var enableSkip = window.GetProperty("user.Skip Enable", false);
var componentPlayCount = utils.CheckComponent("foo_playcount", true);
var useTagRating = window.GetProperty("user.Use Tag Rating", false);
var showPlaylistInfo = window.GetProperty("user.Show Playlist Info", true);
var autoCollapseOnPlaylistSwitch = window.GetProperty("user.Auto Collapse On Playlist Switch", false);
var collapseOnStart = window.GetProperty("user.Collapse On Start", false);
var showNowPlayingCalled = false;
var collapsedOnStart = false;
//--->
var listLength = maxRows = wh = ww = listX = listY = listW = listH = 0;
var listStep = [];
var rowDrag = fileDrag = makeSelectionDrag = linkToLastItem = false;
var panelFocus;
var nowPlayingGroupNr = -1;
var focusGroupNr = -1;
var keyPressed = false;
var guiInstanceType = window.InstanceType;
var tempFocusItemIndex;

//--->
AlbumArtId = {
    front: 0,
    back: 1,
    disc: 2,
    icon: 3,
    artist: 4
};
// =================================================== //
//---> 
var thisPanelName = "Playlist"; //Don't change!! needed on Scrollbar.txt.
//---> Fonts
var fontBase = 12;
var titleFontNormal = gdi.font("Segoe Ui", fontBase, 0);  
var titleFontSelected = gdi.font("Segoe Ui Semibold", fontBase, 0);
var titleFontPlaying = gdi.font("Segoe Ui Semibold", fontBase, 0);
var artistFontNormal = gdi.font("Segoe Ui Semibold", fontBase+6, 0);   
var artistFontPlaying = gdi.font("Segoe Ui Semibold", fontBase+6, 0 | 4);
var playCountFont = gdi.font("Segoe Ui", fontBase-3, 0); 
var albumFont = gdi.font("Segoe Ui Semibold", fontBase+3, 0); 
var dateFont = gdi.font("Segoe UI Semibold", fontBase+4, 1);
var infoFont = gdi.font("Segoe Ui", fontBase-1, 0); 
var coverFont = gdi.font("Segoe Ui Semibold", fontBase-1, 0);
var ratingFontNotRated = gdi.font("Segoe Ui Symbol", fontBase+2); 
var ratingFontRated = gdi.font("Segoe Ui Symbol", fontBase+4); 
//---> Group Colors
var groupTitleColor = RGB(180, 182, 184);
var artistColorNormal = groupTitleColor;
var artistColorPlaying = artistColorNormal;
var albumColorNormal = RGB(130, 132, 134);
var albumColorPlaying = albumColorNormal;
var infoColorNormal = RGB(130, 132, 134);
var infoColorPlaying = infoColorNormal;
var dateColorNormal = RGB(130, 132, 134);
var dateColorPlaying = dateColorNormal;
var lineColorNormal = panelsLineColor;
var lineColorPlaying = lineColorNormal;
var lineColorSelected = panelsLineColorSelected;
var groupTitleColorSelected = groupTitleColor;
var artAlpha = 220;
//---> Item Colors
var titleColorSelected = RGB(160, 162, 164);
var titleColorPlaying = RGB(255, 165, 0);
var titleColorNormal = panelsNormalTextColor;
var titleArtistColor = groupTitleColorSelected;
var ratingColorRated = titleColorNormal;
var countColorNormal = RGB(120, 122, 124);
var countColorSelected = titleColorSelected;
var countColorPlaying = titleColorPlaying;

//---> Row Colors
var rowColorSelected = RGB(35, 35, 35);
var rowColorAlternate = RGB(35, 35, 35);
var rowColorFocusSelected = panelsLineColorSelected;
var rowColorFocusNormal = RGB(80, 80, 80);
var rowColorQueued = RGBA(150, 150, 150, 0);
//--->
var backgroundColor = panelsBackColor;
var dropped = false;
var totalLength = selectionLength = 0;
var listInfoHeight = 48;//24;
//========================================================================================================//

function on_paint(gr) {

    gr.FillSolidRect(0, 0, ww, wh, backgroundColor);

    if (showPlaylistInfo) {

        var selectedIndexesLength = selectedIndexes.length;
        var totalItems = 0;

        selectedIndexesLength ? totalItems = selectedIndexesLength : totalItems = playlistItemCount;

        var items = (totalItems > 1 ? " items selected" : " item selected");

        if (!selectedIndexesLength) {
            selectionLength = totalLength;
            items = (totalItems > 1 ? " items" : " item");
        }

        gr.FillSolidRect(0, 0, ww, listInfoHeight, RGB(40, 40, 40));
        gr.SetTextRenderingHint(TextRenderingHint.ClearTypeGridFit);
        gr.DrawString(fb.GetPlaylistName(activeList) + ": " + totalItems + items + (selectionLength == "NaN:NaN" ? "" : ", Length: " + selectionLength), titleFontSelected, RGB(150, 152, 154), 10, 0, ww - 20, listInfoHeight - 2, StringFormat(1, 1));

    }

    var playingID;
    var selectedID;
    var focusID;
    var queueIndexes = [];
    var queueIndexCount = [];
    var isPlaylistItemQueued = [];
    var groupItemCounter = 0;

    gr.SetTextRenderingHint(5);

    if (plman.PlayingPlaylist == activeList) {
        playingID = plman.GetPlayingItemLocation().PlaylistItemIndex;

    }

    focusID = plman.GetPlaylistFocusItemIndex(activeList);

    if (listLength) {

        //---> Get visible group row count

        var visibleGroupRows = [];
        var tempGroupNr = 0;
        var groupRowCount = 0;

        for (var i = 0; i != maxRows; i++) {

            var ID = list[i + listStep[activeList]];

            if (ID.isGroupHeader) {
                var groupNr = ID.groupNr;
                (groupNr == tempGroupNr) ? groupRowCount++ : groupRowCount = 1;
                visibleGroupRows[groupNr] = groupRowCount;

            }

            tempGroupNr = groupNr;

        }

        //--->

        var tempGroupNr = -1;

        for (var i = 0; i != maxRows; i++) {

            var ID = list[i + listStep[activeList]];


            if (plman.IsPlaylistItemSelected(activeList, ID.nr)) {
                selectedID = ID.nr;
            }

            var metadb = ID.metadb;

            var x = listX,
                y = r[i].y,
                w = listW,
                h = rowH;

            if (ID.isGroupHeader) {

                var groupNr = ID.groupNr;
                var selectedGroup = isGroupSelected(groupNr, playingID);
                groupItemCounter = 1;
                //---> 

                if (selectedGroup) {

                    lineColor = lineColorSelected;
                    artistColor = albumColor = dateColor = infoColor = groupTitleColorSelected;
                    rowColorFocus = rowColorFocusSelected;

                } else {

                    artistColor = artistColorNormal;
                    albumColor = albumColorNormal;
                    infoColor = infoColorNormal;
                    dateColor = dateColorNormal;
                    lineColor = lineColorNormal;
                    rowColorFocus = rowColorFocusNormal;

                }

                //--->

                //(nowPlayingGroupNr == groupNr) ? artistFont = artistFontPlaying : artistFont = artistFontNormal;

                if (nowPlayingGroupNr == groupNr) {

                    artistColor = artistColorPlaying;
                    albumColor = albumColorPlaying;
                    infoColor = infoColorPlaying;
                    dateColor = dateColorPlaying;
                    lineColor = lineColorPlaying;

                    artistFont = artistFontPlaying;

                } else {

                    artistColor = artistColorNormal;
                    albumColor = albumColorNormal;
                    infoColor = infoColorNormal;
                    dateColor = dateColorNormal;
                    lineColor = lineColorNormal;

                    artistFont = artistFontNormal;

                }

                //---> 

                if (groupNr != tempGroupNr) {

                    var clipY = r[i].y + 1;
                    var clipH = visibleGroupRows[groupNr] * rowH - 1;
                    var clipImg = gdi.CreateImage(listW, clipH);
                    var g = clipImg.GetGraphics();

                    var groupY;
                    (i == 0 && ID.rowNr > 1) ? groupY = -((ID.rowNr - 1) * rowH) : groupY = -1;
                    var groupH = rowsInGroup * rowH;
                    var art = artArray[ID.groupNr];
                    var p = 6,
                        artX = (showAlbumArt && (autoAlbumArt ? art !== null : true)) ? p : 0,
                        artY = groupY + p,
                        artW = (showAlbumArt && (autoAlbumArt ? art !== null : true)) ? groupH - p * 2 : 0,
                        artH = groupH - p * 2;

                    //--->
                    g.FillSolidRect(0, groupY, w, groupH, backgroundColor); // Solid background for ClearTypeGridFit text rendering
                    if (selectedGroup) g.FillSolidRect(0, groupY, w, groupH, rowColorSelected);

                    //g.DrawRect(0, groupY, w-1, groupH-1, 1, RGB(0, 0, 255)); // Test
                    //g.DrawRect(artX, artY, artW, artH, 1, rowColorFocus); // Test

                    g.SetTextRenderingHint(TextRenderingHint.ClearTypeGridFit);

                    //g.DrawRect(artX, artY, artW, artH, 1, rowColorFocus);

                    if (isCollapsed[groupNr] && focusGroupNr == groupNr) {

                        g.DrawRect(2, groupY + 2, w - 4, groupH - 4, 1, lineColor);

                    }

                    //************************************************************//                

                    if (showAlbumArt) {



                        if (art) {

                            g.DrawImage(art, artX + 2, artY + 2, artW - 4, artH - 4, 0, 0, art.Width, art.Height, 0, artAlpha);

                        } else if (art === null && !autoAlbumArt) {

                            g.DrawString("NO COVER", coverFont, RGB(100, 100, 100), artX, artY, artW, artH, StringFormat(1, 1));

                        } else if (!autoAlbumArt) {

                            g.DrawString("LOADING", coverFont, lineColor, artX, artY, artW, artH, StringFormat(1, 1));

                        }

                        g.DrawRect(artX, artY, artW - 1, artH - 1, 1, lineColor);

                    }

                    //************************************************************//

                    (!showGroupInfo) ? divGroupH = groupH / 2 : divGroupH = groupH / 3;

                    var leftPad = artX + artW + 10;
                    var path = $("%path%", metadb).slice(0, 4);

                    var radio = (path == "http") ? true : false;

                    //---> DATE
                    var date = $("%date%", metadb);
                    if (date == "?" && radio) date = "";
                    var dateW = Math.ceil(gr.MeasureString(date, dateFont, 0, 0, 0, 0).Width + 5);
                    var dateX = w - dateW - 5;
                    var dateY = groupY;
                    var dateH = groupH;

                    if (groupedID) {
                        (dateX > leftPad) && g.DrawString(date, dateFont, dateColor, dateX, dateY, dateW, dateH, StringFormat(0, 1));
                    }
                    //---> ARTIST
                    var artistX = leftPad;
                    if (showGroupInfo) {
                        artistW = 0 + w - artistX - 0;
                        artistH = divGroupH;
                    } else {
                        artistW = dateX - leftPad - 5;
                        artistH = divGroupH - 5;
                    }
                    var artist = $("$if($greater($len(%album artist%),0),%album artist%,%artist%)", metadb);
                    //trace(artist.length());
                    if (artist == "?" && radio) artist = "Radio Stream";

                    g.DrawString(artist, artistFont, artistColor, artistX, groupY, artistW, artistH, StringFormat(0, 2, 3, 0x1000));



                    //---> ALBUM
                    var albumX = leftPad;
                    var albumW = dateX - leftPad - 5;
                    var albumH = divGroupH;

                    showGroupInfo ? albumY = groupY + divGroupH : albumY = groupY + divGroupH + 5;

                    var album = $("%album%[ - %ALBUMSUBTITLE%]", metadb);
                    if (album == "?" && radio) album = "";
                    if (groupedID) {
                        g.DrawString(album, albumFont, albumColor, albumX, albumY, albumW, albumH, StringFormat(0, showGroupInfo ? 1 : 0, 3, 0x1000));
                    }

                    var albumStringW = gr.MeasureString(album, albumFont, 0, 0, 0, 0).Width;

                    var lineX1 = (groupedID ? leftPad + albumStringW + 10 : leftPad);
                    var lineY = albumY + albumH / 2 + 1;

                    if (!showGroupInfo) {
                        lineX1 = leftPad;
                        lineY = groupY + groupH / 2 + 1;
                    }
                    var lineX2 = (groupedID ? dateX - 10 : w - x + 10);

                    (lineX2 - lineX1 > 0) && g.DrawLine(lineX1, lineY, lineX2, lineY, 1, lineColor);


                    //---> INFO
                    if (showGroupInfo) {

                        var infoX = leftPad;
                        var infoY = groupY + artistH + albumH;
                        var infoH = h;
                        var infoW = w - x - infoX;

                        var bitspersample = $("$Info(bitspersample)", metadb);
                        var samplerate = $("$Info(samplerate)", metadb);
                        var sample = ((bitspersample > 16 || samplerate > 44100) ? " " + bitspersample + "bit/" + samplerate / 1000 + "khz" : "");
                        var codec = $("$ext(%path%)", metadb) ;
                        
                        if (codec == "cue"){
                            codec = $("$ext($Info(referenced_file))", metadb);
                        } else if (codec == "mpc") {
                            codec = codec + "-" + $("$Info(codec_profile)", metadb).replace("quality ", "q");
                        }
                        else if ($("$Info(encoding)", metadb) == "lossy") {
                            if ($("$Info(codec_profile)", metadb) == "CBR") codec = codec + "-" + $("%bitrate%", metadb) + " kbps";
                            else codec = codec + "-" + $("$Info(codec_profile)", metadb);
                        } 
                        if (codec) {
                            codec = codec + sample;
                        } else {
                            codec = path;
                        }
                        var iCount = itemCount[ID.groupNr];
                        var genre = radio ? "" : (groupedID ? "%genre% | " : "");
                        var discNumber = (groupedID != 2 ? "" : $("[ | Disc: %discnumber%/%totaldiscs%]", metadb));
                        var info = $(genre + codec + discNumber + "[ | %replaygain_album_gain%]", metadb) + (radio ? "" : " | " + iCount + (iCount == 1 ? " Track" : " Tracks") + " | Time: " + calculateGroupLength(firstItem[groupNr], lastItem[groupNr]));
                        var w = w - x - 10;
                        g.DrawString(info, infoFont, infoColor, infoX, infoY, infoW, infoH, StringFormat(0, 0, 3, 0x1000));

                        var infoStringH = Math.ceil(gr.MeasureString(info, infoFont, 0, 0, 0, 0).Height + 5);
                        var lineX1 = infoX,
                            lineX2 = 20 + w,
                            lineY = infoY + infoStringH;
                        (lineX2 - lineX1 > 0) && g.DrawLine(lineX1, lineY, lineX2, lineY, 1, lineColor);

                    }

                    //************************************************************//

                    clipImg.ReleaseGraphics(g);
                    gr.DrawImage(clipImg, listX, clipY, listW, clipH, 0, 0, listW, clipH, 0, 255);
                    clipImg.Dispose();

                }

                tempGroupNr = groupNr;

                //---> 

            } else {

                if (ID.isOdd && alternateRowColor) {

                    gr.FillSolidRect(x, y + 1, w, h - 1, rowColorAlternate);

                }

                if (selectedID == ID.nr) {

                    if (alternateRowColor) gr.DrawRect(x, y, w - 1, h, 1, rowColorFocusSelected);
                    else gr.FillSolidRect(x, y, w, h, rowColorSelected);

                    titleColor = titleColorSelected;
                    countColor = countColorSelected;
                    if (playingID == ID.nr) {
                        titleColor = titleColorPlaying;
                        countColor = titleColor;
                    }
                    rowColorFocus = rowColorFocusSelected;
                    titleArtistColor = titleColorNormal;
                    (playingID == ID.nr) ? titleFont = titleFontPlaying : titleFont = titleFontSelected;

                } else if (playingID == ID.nr) {

                    titleColor = titleColorPlaying;
                    titleFont = titleFontPlaying;
                    countColor = countColorPlaying;

                } else {

                    titleFont = titleFontNormal;
                    titleColor = titleColorNormal;
                    countColor = countColorNormal;
                    rowColorFocus = rowColorFocusNormal;
                    titleArtistColor = titleColorSelected;

                }

                //--->
                if (showFocusItem && panelFocus && focusID == ID.nr) {
                    gr.DrawRect(x + 1, y + 1, w - 3, h - 2, 1, rowColorFocus);
                }

                if ((rowDrag || fileDrag) && r[i].state == 1) {
                    gr.DrawLine(x, y, x + w, y, 2, RGB(140, 142, 144));
                }

                if (!dropped && linkToLastItem && !makeSelectionDrag && i == (maxRows - 1)) {
                    gr.DrawLine(x, y + h - 1, x + w, y + h - 1, 2, RGB(255, 165, 0));
                }
                //--->

                var testRect = 0;

                var playCount = (radio ? "" : $("%play_count%", metadb));
                var length = $("[%length%]", metadb);
                var lengthWidth = length ? 50 : 0;
                var playCountWidth = 0;
                if (playCount != 0 && showPlayCount) {
                    playCount = playCount + " |";
                    playCountWidth = gr.MeasureString(playCount, playCountFont, 0, 0, 0, 0).Width;
                }
                var ratingW = 0;
                if (componentPlayCount && showRating) ratingW = listW - ratingBtnX + 16;

                //---> QUEUE
                var queueContents = plman.GetPlaybackQueueContents().toArray();

                if (showQueueItem && queueContents.length) {

                    var queueIndex = plman.FindPlaybackQueueItemIndex(metadb, activeList, ID.nr);

                    for (var q = 0; q != queueContents.length; q++) {

                        var handle = queueContents[q].Handle;

                        var indexCount = 0;

                        if (metadb.Compare(handle)) {

                            queueIndexes.push(queueIndex);

                            isPlaylistItemQueued[i] = true;

                            for (var qi = 0, l = queueIndexes.length; qi < l; qi++) {

                                if (queueIndex == queueIndexes[qi]) queueIndexCount[queueIndex] = ++indexCount;

                            }

                        }

                    }

                }
                if (isPlaylistItemQueued[i]) gr.FillSolidRect(x, y, w, h, rowColorQueued);

                var queue = ((showQueueItem && queueContents.length && queueIndex != -1) ? ('  [' + (queueIndex + 1) + ']' + (queueIndexCount[queueIndex] > 1 ? '*' + queueIndexCount[queueIndex] : '')) : '');

                //---> TITLE
                W = w - lengthWidth - playCountWidth - ratingW;
                var gic = groupItemCounter++;
                var itemNr = (((gic) < 10) ? ("0" + (gic)) : (gic));
                var title = $("$if(%tracknumber%,%tracknumber%.," + itemNr + ".)  %title%", metadb);
                var titleArtist = $("[  \u25AA  $if($greater($len(%album artist%),1),$if($greater($len(%track artist%),1),%track artist%))]", metadb);
                if (titleArtist) {
                    var titleLength = gr.MeasureString(title, titleFont, 0, 0, 0, 0, StringFormat(0, 1, 3, 0x00000800 | 0x1000)).Width;
                    var titleArtistFont = gdi.font("Segoe Ui Semibold", 12, 0);
                    gr.DrawString(titleArtist + queue, titleArtistFont, titleArtistColor, x + 10 + titleLength, y, W - 10 - titleLength, h, StringFormat(0, 1, 3, 0x1000));
                }
                gr.DrawString(title + (titleArtist ? "" : queue), titleFont, titleColor, x + 10, y, W - 10, h, StringFormat(0, 1, 3, 0x1000));



                testRect && gr.DrawRect(x, y - 1, W, h, 1, RGBA(155, 155, 255, 250));

                //---> LENGTH
                X = x + w - lengthWidth - ratingW;
                W = lengthWidth;
                gr.DrawString(length, titleFont, titleColor, X, y, W, h, StringFormat(1, 1));
                testRect && gr.DrawRect(X, y - 1, W, h, 1, RGBA(155, 155, 255, 250));

                //---> COUNT
                if (componentPlayCount && playCount != 0 && showPlayCount) {
                    X = x + w - lengthWidth - playCountWidth - ratingW;
                    W = playCountWidth;
                    gr.DrawString(playCount, playCountFont, countColor, X, y, W, h, StringFormat(1, 1));
                    testRect && gr.DrawRect(X, y - 1, W, h, 1, RGBA(155, 155, 255, 250));

                }

                //---> RATING
                var rating;
                if (useTagRating) {
                    var fileInfo = metadb.GetFileInfo();
                    rating = fileInfo.MetaValue(fileInfo.MetaFind("rating"), 0);
                } else {
                    rating = $("%rating%", metadb);
                }

                if (componentPlayCount && showRating) {

                    for (var j = 0; j < 5; j++) {

                        var x = ratingBtnX + j * ratingBtnW - ratingBtnRightPad;
                        var w = ratingBtnW;

                        if (j < rating) {

                            if (selectedID == ID.nr) {

                                var color = titleColor;

                            } else color = titleColor;

                            gr.DrawString("\u2605", ratingFontRated, color, x, y - 1, w, h, StringFormat(1, 1));

                        } else gr.DrawString("\u2219", ratingFontNotRated, titleColor, x, y - 1, w, h, StringFormat(1, 1));

                    } //eol

                }

            }

        } // eo_row_loop

        needsScrollbar && drawScrollbar(gr);

    } else { //eo ifListLength

        var text = "Drag some tracks here";

        if (fb.PlaylistCount) {
            text = "Playlist: " + plman.GetPlaylistName(activeList) + "\n<--- Empty --->";
        }

        gr.DrawString(text, gdi.font("Segoe Ui", 16, 0), RGB(80, 80, 80), 0, 0, ww, wh, StringFormat(1, 1));

    }

    //gr.DrawRect(listX, listY, listW-1, listH-1, 1, RGB(220, 220, 220)); // Test

}
// =================================================== //

function on_mouse_move(x, y, m) {

    if (uiHacks) {
        try {
            if (m && UIHacks && UIHacks.FrameStyle == 3 && !UIHacks.DisableSizing) {
                UIHacks.DisableSizing = true;
            }
        } catch (e) {
            fb.trace(e)
        };
    }
    if (!listLength) return;
    rowMouseEventHandler(x, y, m);
    scrollbarMouseEventHandler(x, y);
}
// =================================================== //
var onMouseLbtnDown = false;

function on_mouse_lbtn_down(x, y, m) {

    onMouseLbtnDown = true;
    if (!listLength) return;
    rowMouseEventHandler(x, y, m);
    scrollbarMouseEventHandler(x, y);

}
// =================================================== //

function on_mouse_rbtn_down(x, y, m) {

    if (!listLength) return;
    rowMouseEventHandler(x, y, m);

}
// =================================================== //

function on_mouse_lbtn_dblclk(x, y, m) {

    if (!listLength && !safeMode) {
        try {
            WshShell.Run("explorer.exe /e,::{20D04FE0-3AEA-1069-A2D8-08002B30309D}");
        } catch (e) {
            fb.trace(e)
        };
    }

    if (!listLength) return;
    rowMouseEventHandler(x, y, m);
    scrollbarMouseEventHandler(x, y);

}
// =================================================== //

function on_mouse_lbtn_up(x, y, m) {

    onMouseLbtnDown = false;
    if (uiHacks) {
        try {
            if (UIHacks && UIHacks.FrameStyle == 3 && UIHacks.DisableSizing) {
                UIHacks.DisableSizing = false;
            }
        } catch (e) {
            fb.trace(e)
        };
    }

    if (!listLength) return;

    rowMouseEventHandler(x, y, m);
    scrollbarMouseEventHandler(x, y);

}
// =================================================== //

function on_mouse_wheel(delta) {

    if (!listLength) return;
    scrollbarMouseEventHandler(delta);

}
// =================================================== //

function on_mouse_leave() {

    rowMouseEventHandler(0, 0);
    scrollbarMouseEventHandler(0, 0);

}
// =================================================== //

function on_playlist_switch() {

    initList();
    if (!showNowPlayingCalled && autoExpandCollapseGroups && autoCollapseOnPlaylistSwitch) collapseExpand("collapse");
    if (fb.ActivePlaylist == plman.PlayingPlaylist) showNowPlaying();
    showNowPlayingCalled = false;

}
// =================================================== //

function on_playlists_changed() {

    if (fb.ActivePlaylist > fb.PlaylistCount - 1) {
        fb.ActivePlaylist = fb.PlaylistCount - 1;
    }
    window.SetProperty("system.List Step", "");
    initList();

}
// =================================================== //

function on_playlist_items_reordered(playlist) {

    if (playlist != activeList) return;
    if (!collapsedOnStart) {
        initList();
    }
}
// =================================================== //

function on_playlist_items_removed(playlist) {

    if (playlist != activeList) return;
    initList();
}
// =================================================== //

function on_playlist_items_added(playlist) {

    if (playlist != activeList) return;

    if (dragOverID && !linkToLastItem) {

        if (dragOverID.isGroupHeader) {

            plman.MovePlaylistSelection(playlist, -(playlistItemCount - firstItem[dragOverID.groupNr]));

        } else {

            plman.MovePlaylistSelection(playlist, -(playlistItemCount - dragOverID.nr));

        }

    }

    dragOverID = undefined;
    fileDrag = false;
    initList();

    if (linkToLastItem) {
        onScrollStep("scrollToEnd");
        linkToLastItem = false;
        refreshScrollbar();
    }

    for (var i = 0; i != playlistItemCount; i++) {
        if (plman.IsPlaylistItemSelected(activeList, i)) {
            plman.SetPlaylistFocusItem(activeList, i);
            print(i);
            repaintList();
            break;
        }
    }


}

// =================================================== //

function on_playlist_items_selection_change() {

    repaintList();

    if (!mouseOverList) { //this code executes only if selection is made from external panel.
        if (plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Count <= 1) {
            selectedIndexes = [];
            window.Repaint();
        }
    }

    if (showPlaylistInfo) {

        selectedIndexes.length > 0 ? selectionLength = calculateSelectionLength() : selectionLength = $("[%length%]", fb.GetNowPlaying());

        if (selectionLength == "0:00")
            selectionLength = totalLength;

        window.RepaintRect(0, 0, ww, 24);
    }

}
// =================================================== //

function on_metadb_changed(handles, fromhook) {

    repaintList();

}
// =================================================== //

function on_item_focus_change(playlist, from, to) {

    var CtrlKeyPressed = utils.IsKeyPressed(VK_CONTROL);
    var ShiftKeyPressed = utils.IsKeyPressed(VK_SHIFT);

    //-----------------------------------------------------//

    if (!mouseOverList) { //this code executes only if selection is made from external panel.

        if (!selectedIndexes.length && !ShiftKeyPressed && !CtrlKeyPressed) {

            selectedIndexes = [];
            selectedIndexes[0] = to;

        }

        if (CtrlKeyPressed) {

            if (!selectedIndexes.length) {
                selectedIndexes[0] = from;

            }

            for (var i = 0; i < selectedIndexes.length; i++) {

                if (selectedIndexes[i] == to) {

                    selectedIndexes.splice(i, 1);

                }

            } //eol

            if (plman.IsPlaylistItemSelected(fb.ActivePlaylist, to)) {

                selectedIndexes.push(to);
                selectedIndexes.sort(numericAscending);

            }

        } //Ctrl end

        if (ShiftKeyPressed) {

            var a = new Date();
            time = 0;

            var fromTo = [from, to].sort(numericAscending);

            for (i = fromTo[0], l = fromTo[1]; i <= l; i++) {

                selectedIndexes.push(i);

            } //eol i

            //find and remove duplicates.
            var tempSelectedIndexes = [];
            var obj = {};


            for (i = 0, l = selectedIndexes.length; i < l; i++) {

                obj[selectedIndexes[i]] = 0;

            }

            for (i in obj) {

                tempSelectedIndexes.push(i);

            }

            selectedIndexes = tempSelectedIndexes;
            // cleanup selectedIndexes
            tempSelectedIndexes = [];

            for (i = 0, l = selectedIndexes.length; i < l; i++) {

                if (plman.IsPlaylistItemSelected(fb.ActivePlaylist, selectedIndexes[i])) {

                    tempSelectedIndexes.push(selectedIndexes[i]);

                }
            }

            selectedIndexes = tempSelectedIndexes.sort(numericAscending);

            var b = new Date();
            time = "Initialized: " + (b - a) + " ms";

        } //if shift
    }

    //------------------------------------------------------------//

    if (CtrlKeyPressed || ShiftKeyPressed) repaintList();
    if (!ShiftKeyPressed) tempFocusItemIndex = undefined;

    if (!CtrlKeyPressed && !ShiftKeyPressed && plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Count > 1) repaintList();

    focusGroupNr = -1;

    if (!onMouseLbtnDown && fb.ActivePlaylist == plman.PlayingPlaylist) displayFocusItem(to);

    for (var i = 0; i != maxRows; i++) {

        var ID = list[i + listStep[activeList]];
        var groupNr = ID.groupNr;

        if (isCollapsed[groupNr] && ID.isGroupHeader) {

            for (var item = firstItem[groupNr]; item <= lastItem[groupNr]; item++) {

                if (to == item) {
                    focusGroupNr = groupNr;
                    window.Repaint();
                    return;
                }

            }

        }

    }

}
// =================================================== //

function on_playback_pause(state) {
    repaintList();
}
// =================================================== //

function on_playback_starting(cmd, is_paused) {
    repaintList();
}
// =================================================== //

function on_playback_edited(metadb) {

    repaintList();

}
// =================================================== //

function on_playback_queue_changed() {

    repaintList();

}
// =================================================== //
var oldPlayingID;

function on_playback_new_track(metadb) {

    var playingID = plman.GetPlayingItemLocation().PlaylistItemIndex;
    var rating;
    if (useTagRating) {
        var fileInfo = metadb.GetFileInfo();
        rating = fileInfo.MetaValue(fileInfo.MetaFind("rating"), 0);
    } else {
        rating = $("%rating%", metadb);
    }

    repaintList();

    if (newTrackByClick) {

        newTrackByClick = false;

    } else {

        //----------------------->
        if (enableSkip && rating && rating < skipLessThan) {
            if (oldPlayingID < playingID) fb.Next();
            else if (oldPlayingID == undefined || oldPlayingID > playingID) fb.Prev();
        }
        //----------------------->  

        var album = $("%artist%%album%%discnumber%", metadb);

        if (album != tempAlbumOnPlaybackNewTrack || fb.ActivePlaylist == plman.PlayingPlaylist) {

            tempAlbumOnPlaybackNewTrack = album;

            if (autoExpandCollapseGroups) getPlayingGroupCollapseExpand();

        }

    }

    oldPlayingID = playingID;

}
// =================================================== //

function on_playback_stop(reason) {

    if (reason != 2) {
        repaintList();
    }
}
// =================================================== //

function on_focus(is_focused) {

    panelFocus = is_focused;
    repaintList();

}

// =================================================== //

function on_key_down(vkey) {

    var CtrlKeyPressed = utils.IsKeyPressed(VK_CONTROL);
    var ShiftKeyPressed = utils.IsKeyPressed(VK_SHIFT);

    var focusItemIndex = plman.GetPlaylistFocusItemIndex(activeList);

    if (!ShiftKeyPressed || tempFocusItemIndex == undefined) tempFocusItemIndex = focusItemIndex;

    keyPressed = true;

    switch (vkey) {


    case VK_UP:

        if (focusItemIndex == 0 && !listIsScrolledUp) displayFocusItem(0);
        if (focusItemIndex == 0) return;

        if (ShiftKeyPressed) {

            if (tempFocusItemIndex == focusItemIndex) {
                plman.ClearPlaylistSelection(activeList);
                plman.SetPlaylistSelectionSingle(activeList, focusItemIndex, true);
            }

            if (tempFocusItemIndex < focusItemIndex) {
                plman.SetPlaylistSelectionSingle(activeList, focusItemIndex, false);
            }

            plman.SetPlaylistSelectionSingle(activeList, focusItemIndex - 1, true);

        }

        if (!CtrlKeyPressed && !ShiftKeyPressed) {
            plman.ClearPlaylistSelection(activeList);
            plman.SetPlaylistSelectionSingle(activeList, focusItemIndex - 1, true);
        }

        plman.SetPlaylistFocusItem(activeList, focusItemIndex - 1);

        break;
    case VK_DOWN:

        if (focusItemIndex == (playlistItemCount - 1) && !listIsScrolledDown) displayFocusItem(focusItemIndex);
        if (focusItemIndex == (playlistItemCount - 1)) return;

        if (ShiftKeyPressed) {

            if (tempFocusItemIndex == focusItemIndex) {
                plman.ClearPlaylistSelection(activeList);
                plman.SetPlaylistSelectionSingle(activeList, focusItemIndex, true);
            }

            if (tempFocusItemIndex > focusItemIndex) {
                plman.SetPlaylistSelectionSingle(activeList, focusItemIndex, false);
            }

            plman.SetPlaylistSelectionSingle(activeList, focusItemIndex + 1, true);

        }

        if (!CtrlKeyPressed && !ShiftKeyPressed) {
            plman.ClearPlaylistSelection(activeList);
            plman.SetPlaylistSelectionSingle(activeList, focusItemIndex + 1, true);
        }
        plman.SetPlaylistFocusItem(activeList, focusItemIndex + 1);

        break;
    case VK_PRIOR:

        var IDnr = 0;

        if (needsScrollbar) {
            fastScrollActive = true;
            onScrollStep(1, maxRows); // PAGE UP
            var ID = list[Math.floor(maxRows / 2) + listStep[activeList]];
            ID.isGroupHeader ? IDnr = firstItem[ID.groupNr] : IDnr = ID.nr;
        }

        plman.ClearPlaylistSelection(activeList);
        plman.SetPlaylistSelectionSingle(activeList, IDnr, true);
        plman.SetPlaylistFocusItem(activeList, IDnr);

        break
    case VK_NEXT:

        var IDnr = (playlistItemCount - 1);

        if (needsScrollbar) {
            fastScrollActive = true;
            onScrollStep(-1, maxRows); // PAGE DOWN
            var ID = list[Math.floor(maxRows / 2) + listStep[activeList]];
            ID.isGroupHeader ? IDnr = firstItem[ID.groupNr] : IDnr = ID.nr;
        }

        plman.ClearPlaylistSelection(activeList);
        plman.SetPlaylistSelectionSingle(activeList, IDnr, true);
        plman.SetPlaylistFocusItem(activeList, IDnr);

        break;
    case VK_DELETE:

        plman.RemovePlaylistSelection(activeList, crop = false);

        break;
    case VK_KEY_A:

        CtrlKeyPressed && selectAll();

        break;
    case VK_KEY_F:

        CtrlKeyPressed && fb.RunMainMenuCommand("Edit/Search");
        ShiftKeyPressed && fb.RunMainMenuCommand("Library/Search");

        break;
    case VK_RETURN:

        plman.ExecutePlaylistDefaultAction(activeList, focusItemIndex);
        newTrackByClick = true;

        break;

    case VK_HOME:

        plman.ClearPlaylistSelection(activeList);
        plman.SetPlaylistSelectionSingle(activeList, 0, true);
        plman.SetPlaylistFocusItem(activeList, 0);

        break;
    case VK_END:

        plman.ClearPlaylistSelection(activeList);
        plman.SetPlaylistSelectionSingle(activeList, (playlistItemCount - 1), true);
        plman.SetPlaylistFocusItem(activeList, (playlistItemCount - 1));

        break;
    case VK_KEY_N:
        if (CtrlKeyPressed) {

            fb.CreatePlaylist(fb.PlaylistCount, "");
            fb.ActivePlaylist = fb.PlaylistCount - 1;

        }
        break;
    case VK_KEY_O:
        if (ShiftKeyPressed) {
            fb.RunContextCommandWithMetadb("Open Containing Folder", fb.GetFocusItem());
        }
        break;
    case VK_KEY_P:
        if (CtrlKeyPressed) {
            fb.RunMainMenuCommand("File/Preferences");
        }
        break;
    case VK_KEY_M:
        if (CtrlKeyPressed) {
            fb.RunMainMenuCommand("View/Playlist Manager");
        }
        break;
    case VK_KEY_Q:

        if (CtrlKeyPressed && ShiftKeyPressed) {
            plman.FlushPlaybackQueue();
            return;
        }

        if (CtrlKeyPressed) {

            plman.AddPlaylistItemToPlaybackQueue(activeList, focusItemIndex);

        } else if (ShiftKeyPressed) {

            var index = plman.FindPlaybackQueueItemIndex(fb.GetFocusItem(), activeList, focusItemIndex)
            plman.RemoveItemFromPlaybackQueue(index);

        }
        break;
    case VK_F5:
        initList();
        break;
    case VK_KEY_X:
        if (CtrlKeyPressed) {
            cut();
        }
        break;
    case VK_KEY_V:
        if (CtrlKeyPressed) {
            paste();
        }
        break;


    }

}
// =================================================== //

function on_key_up(vkey) {

    if (vkey == VK_PRIOR || vkey == VK_NEXT) {

        fastScrollActive = false;
        getAlbumArt();

    }

}
// =================================================== //

function on_size() {

    ww = window.Width;
    wh = window.Height;

    if (ww <= 0 || wh <= 0) return;

    listOnSize();

}
// =================================================== //

function on_drag_enter(action, x, y, mask) {

    dropped = false;

    if (listLength && (y > (r[maxRows - 1].y + rowH)) && !linkToLastItem && ((needsScrollbar && listIsScrolledDown) || !needsScrollbar)) {

        linkToLastItem = true;
        r[maxRows - 1].repaint();

    } else linkToLastItem = false;


}
// =================================================== //

function on_drag_drop(action, x, y, mask) {

    var idx;

    if (!fb.PlaylistCount) {

        idx = fb.CreatePlaylist(0, "Default");
        fb.ActivePlaylist = 0;

    } else {

        plman.ClearPlaylistSelection(activeList);
        idx = activeList;

    }

    if (idx !== undefined) {

        action.ToPlaylist();
        action.Playlist = idx;
        action.ToSelect = true;

    }

    dropped = true;
    fileDrag = false;
    repaintList();

}
// =================================================== //

function on_drag_over(action, x, y, mask) {

    rowMouseEventHandler(x, y);

}
// =================================================== //

function on_drag_leave() {

    dragOverID = undefined;
    fileDrag = linkToLastItem = dropped = false;

    repaintList();

    if (scrollStepRepeatTimerStarted) {
        stopScrollRepeat();
    }

}
// =================================================== //

function getAlbumArt() {

    if (!showAlbumArt) return;

    if (fastScrollActive) return;

    for (var i = 0; i != maxRows; i++) {

        var ID = list[i + listStep[activeList]];

        var groupNr = ID.groupNr;

        if (ID.isGroupHeader) {

            if (groupNr != tempGroupNrOnGetAlbumArt) {

                if (!artArray[groupNr] && artArray[groupNr] !== null) {

                    utils.GetAlbumArtAsync(window.ID, ID.metadb, AlbumArtId.front);

                }

            }

            tempGroupNrOnGetAlbumArt = groupNr;

        }

    }

}
// =================================================== //
var artSize = rowsInGroup * rowH;

function on_get_album_art_done(metadb, art_id, image, image_path) {

    if (image && image.Height > artSize) {
        image = image.Resize(artSize, artSize, 0);
    }
    if (image) {
        image = image;
    } else {
        image = null;
    }

    var tempGroupNr = -1;

    for (var i = 0; i != maxRows; i++) {

        var ID = list[i + listStep[activeList]];
        var groupNr = ID.groupNr;

        if (ID.isGroupHeader && (artArray[groupNr] !== null) && groupNr != tempGroupNr && ID.metadb.Compare(metadb)) {

            artArray[groupNr] = image;

            tempGroupNr = groupNr;

            repaintList();

        }

    }

}
// =================================================== //

function selectAll() {

    for (var i = 0; i != playlistItemCount; i++) {
        selectedIndexes[i] = i;
    }

    plman.SetPlaylistSelection(fb.ActivePlaylist, selectedIndexes, true);

}
// =================================================== //

function resizeDone() {

    if (listLength) {
        getAlbumArt();
    }
}
// =================================================== //

function calculateSelectionLength() {

    var selectionLengthInSeconds = 0;
    var a = selectedIndexes[0];
    var b = selectedIndexes[selectedIndexes.length - 1];

    for (var item = a; item <= b; item++) {

        selectionLengthInSeconds += parseFloat(fb.TitleFormat("%length_seconds_fp%").EvalWithMetadb(getPlaylistItems.Item(item)));
    }

    return timeFormat(selectionLengthInSeconds);

}
// =================================================== //

function calculateGroupLength(a, b) {

    var groupLengthInSeconds = 0;

    for (var item = a; item <= b; item++) {

        groupLengthInSeconds += parseFloat(fb.TitleFormat("%length_seconds_fp%").EvalWithMetadb(getPlaylistItems.Item(item)));

    }

    //if(!caller())
    //return timeFormatListTotal(groupLengthInSeconds);
    //else
    return timeFormat(groupLengthInSeconds);

}
// =================================================== //

function repaintList() {

    var ex = 10;
    listW && window.RepaintRect(listX - ex, listY - ex, listW + ex * 2, listH + ex * 2);

}
// =================================================== //


function collapseExpand(arg, nowPlaying, selected) {

    collapsedOnStart = false;

    if (!playlistItemCount) return;

    var playingID = plman.GetPlayingItemLocation().PlaylistItemIndex;

    if (typeof (arg) == "number") {

        var thisGroupNr = arg;

        if (isCollapsed[thisGroupNr]) {

            for (var j = lastItemID[thisGroupNr]; j >= firstItemID[thisGroupNr]; j--) {

                list.splice(_firstItemID[thisGroupNr], 0, $list[j]);

            }

            isCollapsed[thisGroupNr] = false;

        } else if (selected == undefined) {

            list.splice(_firstItemID[thisGroupNr], itemCount[thisGroupNr]);
            isCollapsed[thisGroupNr] = true;

        }

    } else {

        for (var i = groupNr; i >= 0; i--) {

            if (i == selected) continue;

            if (arg == "collapse") {

                if (isCollapsed[i] && (i == nowPlaying || i == selected)) {

                    var thisGroupNr = nowPlaying;

                    for (var j = lastItemID[thisGroupNr]; j >= firstItemID[thisGroupNr]; j--) {

                        list.splice(_firstItemID[thisGroupNr], 0, $list[j]);

                    }

                    isCollapsed[thisGroupNr] = false;

                }

                if (i == nowPlaying) continue;

                if (!isCollapsed[i]) {
                    list.splice(_firstItemID[i], itemCount[i]);
                    isCollapsed[i] = true;
                }

            } else if (arg == "expand") {

                list = $list.slice(0);
                for (var i = groupNr; i >= 0; i--) {
                    isCollapsed = [];
                }

            }

        } //eol

    }

    //---> update _firstItemID
    for (var i = 0; list[i]; i++) {

        var ID = list[i];

        if (ID.isGroupHeader && ID.rowNr == rowsInGroup) {

            _firstItemID[ID.groupNr] = i + 1;

        }

    } //eol

    listLength = list.length;
    listOnSize();
    window.Repaint();

    if (nowPlaying != undefined) {

        //when outo or collapse all but now playing is selected scrolls now playing album to the top

        for (var j = 0; j < listLength; j++) {

            var ID = list[j];

            if (ID.isGroupHeader && ID.groupNr == nowPlaying) {

                var step = j;
                if (step < 0) step = 0;
                listStep[activeList] = Math.min(listLength - maxRows, step);
                window.SetProperty("system.List Step", listStep.toString());
                break;

            }

        } // eol

    }

    listOnSize();
    onScrollStep(0); //check and fix false scrolled up or down var if needed
    window.Repaint();

}
// =================================================== //

function getPlayingGroupCollapseExpand() {

    if (!fb.IsPlaying || fb.ActivePlaylist != fb.PlayingPlaylist) return;

    var playingItemLocation = plman.GetPlayingItemLocation();
    var isValid;

    if (playingItemLocation.IsValid) {
        collapseExpand("collapse", getPlayingGroupNr());
    }

    var counter = 0;

    if (!playingItemLocation.IsValid) {
        var timer = window.SetInterval(function () { // timer for getting delayed item location info when skip track selected 

            isValid = plman.GetPlayingItemLocation().IsValid;

            counter++;

            if (isValid || counter == 100 || !fb.IsPlaying) {

                window.ClearInterval(timer);

                if (fb.IsPlaying) {
                    collapseExpand("collapse", getPlayingGroupNr());
                }

            }

        }, 100);

    }

    function getPlayingGroupNr() {

        var playingIndex = -1;

        if (plman.PlayingPlaylist == activeList) {
            playingIndex = plman.GetPlayingItemLocation().PlaylistItemIndex;
        }

        for (var g = 0; g <= groupNr; g++) {
            for (var i = firstItem[g]; i <= lastItem[g]; i++) {
                if (playingIndex == i) {
                    return g;
                }
            }
        }
    }

}
// =================================================== //

function isGroupSelected(groupNr, playingID) {

    // searches only currently visible groups
    var selectedCount = 0;
    nowPlayingGroupNr = -1;

    for (var item = firstItem[groupNr]; item <= lastItem[groupNr]; item++) {
        if (plman.IsPlaylistItemSelected(activeList, item)) selectedCount++;
        if (playingID == item) nowPlayingGroupNr = groupNr;
    }

    if (selectedCount == (lastItem[groupNr] + 1 - firstItem[groupNr])) return true;
    else return false;

}
// =================================================== //

function displayFocusItem(focusID) {

    if (listLength <= maxRows) return;

    var visibleGroupRows = [];
    var tempGroupNr = 0;
    var groupRowCount = 0;

    for (var i = 0; i != maxRows; i++) {

        var ID = list[i + listStep[activeList]];

        if (isCollapsed.length && ID.isGroupHeader) {

            var groupNr = ID.groupNr;

            (groupNr == tempGroupNr) ? groupRowCount++ : groupRowCount = 1;
            visibleGroupRows[groupNr] = groupRowCount;

        }

        tempGroupNr = groupNr;

    }

    for (var i = 0; i != maxRows; i++) {

        var ID = list[i + listStep[activeList]];
        var groupNr = ID.groupNr;

        if (isCollapsed[groupNr] && ID.isGroupHeader) {

            for (var item = firstItem[groupNr]; item <= lastItem[groupNr]; item++) {

                if (focusID == item && visibleGroupRows[groupNr] == rowsInGroup) {

                    return;

                }
            }

        } else if (ID && focusID == ID.nr) return;

    }

    var IDnr;
    for (var i = 0; i < listLength; i++) {

        var ID = list[i];

        var groupNr = ID.groupNr;

        if (isCollapsed.length && ID.isGroupHeader && ID.rowNr == rowsInGroup) {

            for (var item = firstItem[groupNr]; item <= lastItem[groupNr]; item++) {

                if (focusID == item && isCollapsed[groupNr]) {
                    IDnr = firstItem[groupNr];

                }

            }

        }

        if (IDnr != undefined || ID.nr == focusID) {

            var step = i - Math.floor(maxRows / 2);
            if (step < 0) step = 0;

            listStep[activeList] = step;

            window.SetProperty("system.List Step", listStep.toString());
            listOnSize();

            window.Repaint();

            listIsScrolledUp = (listStep[activeList] == 0);
            listIsScrolledDown = ((list[maxRows - 1 + listStep[activeList]]) == list[listLength - 1]);

            return;

        }

    } // eol

}
// =================================================== //

function showNowPlaying() {

    if (!fb.Isplaying) return;

    var getPlayingItemLocation = plman.GetPlayingItemLocation()
    if (!getPlayingItemLocation.IsValid) return;

    if (fb.ActivePlaylist != plman.PlayingPlaylist) {
        fb.ActivePlaylist = plman.PlayingPlaylist;
        initList();
    }

    if (autoExpandCollapseGroups && autoCollapseOnPlaylistSwitch) collapseExpand("collapse");

    var playingID = getPlayingItemLocation.PlaylistItemIndex;
    plman.ClearPlaylistSelection(activeList);
    plman.SetPlaylistSelectionSingle(activeList, playingID, true);
    plman.SetPlaylistFocusItem(activeList, playingID);

    for (var i = 0; i < listLength; i++) {

        var ID = list[i];
        var groupNr = ID.groupNr;

        if (isCollapsed.length && ID.isGroupHeader && ID.rowNr == rowsInGroup) {

            for (var item = firstItem[groupNr]; item <= lastItem[groupNr]; item++) {

                if (playingID == item && isCollapsed[groupNr]) collapseExpand(groupNr);

            }

        }

        if (ID.nr == playingID) {

            var step = i - Math.floor(maxRows / 2);
            if (step < 0) step = 0;

            listStep[activeList] = step;

            window.SetProperty("system.List Step", listStep.toString());

            on_size();
            window.Repaint();

            break;

        }

    } // eol

    if (fb.ActivePlaylist != plman.PlayingPlaylist)
        showNowPlayingCalled = true;

}
// =================================================== //
(function initList() {
    //print(caller());
    tempAlbumOnPlaybackNewTrack = undefined;
    tempGroupNrOnGetAlbumArt = -1;

    activeList = plman.ActivePlaylist;
    playlistCount = plman.PlaylistCount;
    playlistItemCount = plman.PlaylistItemCount(activeList);
    getPlaylistItems = plman.GetPlaylistItems(activeList);
    selectedItemCount = plman.GetPlaylistSelectedItems(activeList).Count;

    listIsScrolledUp = listIsScrolledDown = false;
    list = [];
    $list = [];
    firstItem = [];
    firstItemID = [];
    _firstItemID = [];
    lastItem = [];
    lastItemID = [];
    itemCount = [];
    isCollapsed = [];
    selectedIndexes = [];
    queueIndexes = [];
    artArray = [];
    groupNr = 0;
    totalGroups = 0;
    var a, b, metadb;
    var id = 0;
    var oddItem = 0;
    var from = to = 0;

    var initTest = 0;
    if (initTest) from = new Date();

    for (var i = 0; i != playlistItemCount; i++) {

        metadb = getPlaylistItems.Item(i);

        a = fb.TitleFormat(groupFormat).EvalWithMetadb(metadb);

        if (a != b && showGroupHeader) {

            for (var groupHeaderRow = 1; groupHeaderRow <= rowsInGroup; groupHeaderRow++) {

                group = {

                    groupNr: groupNr, // first group nr = 0
                    metadb: metadb,
                    isGroupHeader: true,
                    rowNr: groupHeaderRow

                };

                firstItem[groupNr] = i;
                $list[id] = group;

                id++

                if (groupHeaderRow == rowsInGroup) {
                    firstItemID[groupNr] = id;
                }

            }

            if (groupNr > 0) {
                var gNr = groupNr - 1;
                lastItem[gNr] = i - 1;
                lastItemID[gNr] = id - rowsInGroup - 1;
                itemCount[gNr] = lastItem[groupNr - 1] - firstItem[groupNr - 1] + 1;
            }

            groupNr++;

            b = a;

            if (i % 2 == 0) oddItem = 0;
            if (i % 2 == 1) oddItem = 1;

        }

        var item = {

            metadb: metadb,
            nr: i,
            isOdd: i % 2 == oddItem

        };

        $list[id] = item;

        id++;


        if (selectedItemCount && plman.IsPlaylistItemSelected(activeList, i)) {
            selectedIndexes.push(i);
        }

    } //eol

    if (initTest) {
        to = new Date();
        print("Initialized: " + (to - from) + " ms");
    }

    groupNr--;
    totalGroups = groupNr;

    gNr = groupNr;
    lastItem[gNr] = playlistItemCount - 1;
    lastItemID[gNr] = id - 1;
    itemCount[gNr] = lastItem[gNr] - firstItem[gNr] + 1;

    list = $list.slice(0);
    _firstItemID = firstItemID.slice(0);
    listLength = list.length;

    (listOnSize = function () {

        if (ww <= 0 || wh <= 0) return;

        isResizingDone(ww, wh);

        listX = listLeft;
        listY = listTop + (showPlaylistInfo ? listInfoHeight : 0);
        listH = Math.max(0, window.Height - listY - listBottom);
        listW = Math.max(100, window.Width - listX - listRight);

        maxRows = Math.max(0, Math.min(listLength, Math.floor(listH / rowH)));

        if (listStep[activeList] + maxRows > listLength && listLength >= maxRows) {
            listStep[activeList] += listLength - (listStep[activeList] + maxRows);
            window.SetProperty("system.List Step", listStep.toString());
        }

        needsScrollbar = listLength > maxRows;

        if (needsScrollbar && showScrollbar) {
            listW = listW - scrollbarWidth - scrollbarRight;
        }

        //---> Row Object

        r = [];
        b = [];

        ratingBtnW = 14;
        ratingBtnX = listX + listW - ratingBtnW * 5;

        if (listLength) {
            for (var i = 0; i != maxRows; i++) {

                var rowY = listY + i * rowH;
                r[i] = new Row(listX, rowY, listW, rowH);

            }

            (initRowButton = function () {

                ratingBtnRightPad = 5;
                for (var i = 0; i != maxRows; i++) {

                    r[i].b = [];

                    for (var j = 0; j < 5; j++) {

                        var x = ratingBtnX + j * ratingBtnW - ratingBtnRightPad;
                        var y = r[i].y + rowH / 2 - ratingBtnW / 2 - 1;

                        r[i].b[j] = new RowButton(x, y, ratingBtnW, ratingBtnW);

                    }
                }

            })();

        }

        //---> Scrollbar

        scrollbarX = window.Width - scrollbarWidth - scrollbarRight;
        scrollbarY = listTop + (showPlaylistInfo ? listInfoHeight : 0);
        scrollbarBottom = listBottom;
        scrollbarHeight = window.Height - scrollbarY - scrollbarBottom;

        refreshScrollbar();

        //---> 

        if (needsScrollbar) {
            createScrollbarThumbImages();
        }

    })();

    //---> init list step
    listStep = [];

    var step = [];
    var s = window.GetProperty("system.List Step", "");
    s.indexOf(",") != -1 ? step = s.split(",") : step[0] = Math.max(0, s);

    for (var i = 0; i < playlistCount; i++) {

        listStep[i] = (step[i] == undefined ? 0 : (isNaN(step[i]) ? 0 : Math.max(0, step[i])));

    }
    window.SetProperty("system.List Step", listStep.toString());
    //--->

    window.Repaint();
    if (needsScrollbar) {
        repaintScrollbar();
    }

    plman.SetActivePlaylistContext();

    if (showPlaylistInfo) {
        totalLength = calculateGroupLength(0, playlistItemCount - 1);
        if (selectedIndexes)
            selectionLength = calculateSelectionLength();
    }

})(); //eoInitList

// =================================================== //
var rowDrag = fileDrag = linkToLastItem = doubleClicked = mouseOverList = newTrackByClick = actionNotAllowed = clickedOnSelectedItem = selectWithDrag = false;
var oldRowBtn, oldRowNr, oldRow, oldID, selectedIndex, dragOverID;

function rowMouseEventHandler(x, y, m) {

    var CtrlKeyPressed = utils.IsKeyPressed(VK_CONTROL);
    var ShiftKeyPressed = utils.IsKeyPressed(VK_SHIFT);

    if (thumbDown || !listLength) return;

    var c = caller();

    var thisID, thisRow, thisRowNr, thisRowBtn;
    var thisRowBtnNr = 0;

    mouseOverList = false;
    mouseInRatingBtn = false;

    for (var i = 0; r[i]; i++) {

        if (r[i].mouseInThisRow(x, y)) {
            mouseOverList = true;
            thisRow = r[i];
            thisID = list[i + listStep[activeList]];
            thisRowNr = i;
            //->
            if (showRating && !thisID.isGroupHeader) {

                var b = r[i].b;

                for (var j = 0; j < 5; j++) {

                    if (b[j].mouseInThisRowButton(x, y)) {

                        thisRowBtn = b[j];
                        thisRowBtnNr = j;
                        mouseInRatingBtn = true;

                    }

                }

            }

        }

    }

    if (c == "on_drag_over") {

        fileDrag = true;

        if (thisID) {

            dragOverID = thisID;

        }

        c = "on_mouse_move";

    }

    switch (c) {

    case "on_mouse_move":

        if (thisRow !== undefined) {

            mouseOverList = true;
            linkToLastItem = false;

        }

        if (selectedIndexes.length && !doubleClicked && m == 1 && (oldRow && thisRow != oldRow)) {

            if (fb.IsAutoPlaylist(activeList) && !actionNotAllowed) {

                window.SetCursor(IDC_NO);
                actionNotAllowed = true;

            }
            dropped = false;
            if (!actionNotAllowed && clickedOnSelectedItem) rowDrag = true;
            if (!clickedOnSelectedItem) selectWithDrag = true;
        }


        if ((fileDrag || rowDrag || makeSelectionDrag) && thisID && thisID.isGroupHeader && isCollapsed[thisID.groupNr]) {
            collapseExpand(thisID.groupNr);
        }

        //->
        if (oldRow && oldRow != thisRow) {

            if (!clickedOnSelectedItem && m == 1 && thisID && thisID.isGroupHeader) {

                var firstIDnr = firstItem[thisID.groupNr];

                if ((oldID.nr < firstIDnr && selectedIndex > oldID.nr) || (oldID.nr == firstIDnr && selectedIndex < oldID.nr)) {

                    plman.SetPlaylistSelectionSingle(activeList, oldID.nr, false);

                }

            }

            oldRow.changeState(0);

        }

        if (thisRow && thisRow != oldRow) {
            thisRow.changeState(1);

            if (rowDrag || fileDrag || makeSelectionDrag) {

                if (thisRowNr == 0 && !listIsScrolledUp) {

                    startScrollRepeat("dragUp");

                }

                if ((thisRowNr == (maxRows - 1)) && !listIsScrolledDown) {

                    startScrollRepeat("dragDown");

                }

            }

            if (!clickedOnSelectedItem && m == 1) {

                makeSelectionDrag = true;

                selectedIndexes = [];

                if (thisID && !thisID.isGroupHeader) {

                    for (var i = selectedIndex; i <= thisID.nr; i++) {
                        selectedIndexes.push(i);
                    }
                    for (var i = selectedIndex; i >= thisID.nr; i--) {
                        selectedIndexes.push(i);
                        selectedIndexes.sort(numericAscending);
                    }
                    if (selectedIndexes[0] == selectedIndexes[1]) selectedIndexes.length = 1;

                    if (selectedIndexes[0] != undefined && !thisID.isGroupHeader) {
                        plman.ClearPlaylistSelection(activeList);
                        plman.SetPlaylistSelection(fb.ActivePlaylist, selectedIndexes, true);
                    }
                }
            }
        }

        //->

        if ((rowDrag || fileDrag) && listLength && (y > (r[maxRows - 1].y + rowH)) && !linkToLastItem && ((needsScrollbar && listIsScrolledDown) || !needsScrollbar)) {

            linkToLastItem = true;
            r[maxRows - 1].repaint();

        }

        if ((rowDrag || fileDrag || makeSelectionDrag) && thisID && (thisRowNr != 0 && thisRowNr != (maxRows - 1))) {

            stopScrollRepeat();

        }

        oldID = thisID;
        oldRow = thisRow;
        //->

        break;

    case ("on_mouse_lbtn_down"):

        if (doubleClicked) return;

        if (!thisID) {
            if (!mouseInScrollbar) {
                selectedIndexes = [];
                plman.ClearPlaylistSelection(activeList);
            }
            return;
        }

        var thisIndex = thisID.nr;

        if (thisID.isGroupHeader) {

            if (!CtrlKeyPressed) selectedIndexes = [];

            var thisGroupNr = thisID.groupNr;

            for (var id = firstItem[thisGroupNr]; id <= lastItem[thisGroupNr]; id++) {

                selectedIndexes.push(id);

            }

            plman.ClearPlaylistSelection(activeList);
            plman.SetPlaylistSelection(fb.ActivePlaylist, selectedIndexes, true);
            plman.SetPlaylistFocusItem(activeList, firstItem[thisID.groupNr]);

            clickedOnSelectedItem = true;

            if (autoExpandCollapseGroups) {
                collapseExpand("collapse", undefined, thisID.groupNr);
                collapseExpand(thisID.groupNr, undefined, thisID.groupNr);
                doubleClicked = true;
            }

        } else {

            IDIsSelected = plman.IsPlaylistItemSelected(activeList, thisIndex);

            IDIsSelected ? clickedOnSelectedItem = true : clickedOnSelectedItem = false;

            if (!CtrlKeyPressed && !ShiftKeyPressed && !IDIsSelected) {

                selectedIndexes = [];
                plman.ClearPlaylistSelection(activeList);

            }

            if (ShiftKeyPressed) {

                selectedIndexes = [];

                var a = b = 0;

                if (selectedIndex == undefined) selectedIndex = plman.GetPlaylistFocusItemIndex(activeList);

                if (selectedIndex < thisIndex) {
                    a = selectedIndex;
                    b = thisIndex;
                } else {
                    a = thisIndex;
                    b = selectedIndex;
                }

                for (var id = a; id <= b; id++) {

                    selectedIndexes.push(id);

                }

                plman.ClearPlaylistSelection(activeList);
                plman.SetPlaylistSelection(activeList, selectedIndexes, true);

            } else {

                plman.SetPlaylistSelectionSingle(activeList, thisIndex, true);

                if (utils.IsKeyPressed(VK_KEY_Q))
                    plman.AddPlaylistItemToPlaybackQueue(activeList, thisIndex);
                else if (utils.IsKeyPressed(VK_KEY_Z)) {
                    var index = plman.FindPlaybackQueueItemIndex(thisID.metadb, activeList, thisIndex)
                    plman.RemoveItemFromPlaybackQueue(index);
                }

            }

            if (!IDIsSelected && !CtrlKeyPressed && !ShiftKeyPressed) {

                selectedIndexes = [];

                selectedIndexes[0] = thisIndex;

            }

            if (CtrlKeyPressed) {

                if (!IDIsSelected) selectedIndexes.push(thisIndex);

                plman.SetPlaylistSelectionSingle(activeList, thisIndex, IDIsSelected ? false : true);

                if (IDIsSelected) {

                    for (var i = 0; i < selectedIndexes.length; i++) {

                        if (selectedIndexes[i] == thisIndex) selectedIndexes.splice(i, 1);

                    }

                }

            }

            plman.SetPlaylistFocusItem(activeList, thisIndex);

            if (selectedIndex == undefined) selectedIndex = thisIndex;

            if (selectedIndexes.length > 1) selectedIndexes.sort(numericAscending);

        } //eof isGroup else

        break;

    case ("on_mouse_rbtn_down"):

        if (!thisID) {
            if (!mouseInScrollbar) {
                selectedIndexes = [];
                plman.ClearPlaylistSelection(activeList);
            }
            return;
        }

        var thisIndex = thisID.nr;

        if (thisID.isGroupHeader) {

            plman.SetPlaylistFocusItem(activeList, firstItem[thisID.groupNr]);

            if (isGroupSelected(thisID.groupNr)) return;

            selectedIndexes = [];

            var thisGroupNr = thisID.groupNr;

            for (var id = firstItem[thisGroupNr]; id <= lastItem[thisGroupNr]; id++) {

                selectedIndexes.push(id);

            }

            plman.ClearPlaylistSelection(activeList);
            plman.SetPlaylistSelection(fb.ActivePlaylist, selectedIndexes, true);


        } else {

            var IDIsSelected = plman.IsPlaylistItemSelected(activeList, thisIndex);

            if (IDIsSelected) {

                plman.SetPlaylistFocusItem(activeList, thisIndex);
                repaintList();

            } else {

                selectedIndexes = [];
                plman.ClearPlaylistSelection(activeList);
                selectedIndexes[0] = thisIndex;
                plman.SetPlaylistFocusItem(activeList, thisIndex);
                plman.SetPlaylistSelectionSingle(activeList, thisIndex, true);

            }

        }

        break;

    case ("on_mouse_lbtn_dblclk"):

        if (!thisID) return;
        doubleClicked = true;

        //---> Set rating
        if (mouseInRatingBtn) {

            var metadb = thisID.metadb;

            if (useTagRating) {
                var fileInfo = metadb.GetFileInfo();
                var currentRating = fileInfo.MetaValue(fileInfo.MetaFind("rating"), 0);
            } else {
                var currentRating = $("%rating%", metadb);
            }

            var rate = thisRowBtnNr + 1;

            if (useTagRating) {

                if (!metadb.RawPath.indexOf("http://") == 0) {

                    (currentRating == 1 && rate == 1) ? metadb.UpdateFileInfoSimple("RATING", undefined) : metadb.UpdateFileInfoSimple("RATING", rate);

                }

            } else {

                (currentRating == 1 && rate == 1) ? fb.RunContextCommandWithMetadb("<not set>", metadb) : fb.RunContextCommandWithMetadb("Rating/" + rate, metadb);

            }
            return;

        }

        if (thisID.isGroupHeader) {

            collapseExpand(thisID.groupNr);

        } else if (!utils.IsKeyPressed(VK_KEY_Q) && !utils.IsKeyPressed(VK_KEY_Z)) {

            plman.ExecutePlaylistDefaultAction(activeList, thisID.nr);
            newTrackByClick = true;

        }

        break;

    case "on_mouse_lbtn_up":

        if (doubleClicked) {
            doubleClicked = false;
            return;
        }

        if (thisRow) {
            thisRow.changeState(0);
        }

        if (thisID && thisID.nr !== undefined) {

            if (rowDrag && thisID) {

                var selectedItems = plman.GetPlaylistSelectedItems(activeList);
                var selectedItemCount = selectedItems.Count;
                var focusIndex = plman.GetPlaylistFocusItemIndex(activeList);
                var focusHandle = plman.GetPlaylistFocusItemHandle(false);
                var thisIndex = thisID.nr;
                var add = 0;

                if (selectedItemCount > 1) {

                    //--->
                    var temp;
                    var odd = false;
                    for (var i = 0; i < playlistItemCount; i++) {
                        if (plman.IsPlaylistItemSelected(activeList, i)) {
                            if (temp != undefined && ((i - 1) != temp)) {
                                odd = true;
                                break;
                            }
                            temp = i;
                        }
                    }
                    //--->

                    if (odd) {

                        for (var i = 0; i < selectedIndexes.length; i++) {

                            if (selectedIndexes[i] < thisIndex) {
                                add = i + 1;

                            }

                        }

                        plman.MovePlaylistSelection(activeList, -listLength);

                    } else {

                        for (var i = 0; i < selectedIndexes.length; i++) {

                            if (selectedIndexes[i] == focusIndex) {
                                add = i;
                                break;
                            }

                        }

                    }

                }

                if (focusIndex > thisIndex) {

                    (selectedItemCount > 1) ? (odd ? delta = thisIndex - add : delta = -(focusIndex - thisIndex - add)) : delta = -(focusIndex - thisIndex);

                } else {

                    (selectedItemCount > 1) ? (odd ? delta = thisIndex - add : delta = (thisIndex - focusIndex - (selectedItemCount - add))) : delta = (thisIndex - 1 - focusIndex);

                }

                if (!odd && plman.IsPlaylistItemSelected(plman.ActivePlaylist, thisIndex)) delta = 0;

                plman.MovePlaylistSelection(activeList, delta);

            } //row drag end


            if (!CtrlKeyPressed && !ShiftKeyPressed && !rowDrag && !selectWithDrag) {

                if (plman.GetPlaylistSelectedItems(activeList).Count > 1) {

                    selectedIndexes = [];
                    selectedIndexes[0] = thisID.nr;
                    plman.ClearPlaylistSelection(activeList);
                    plman.SetPlaylistSelectionSingle(activeList, thisID.nr, true);

                }

            }

        }

        if (linkToLastItem) {

            plman.MovePlaylistSelection(activeList, listLength - plman.GetPlaylistSelectedItems(activeList).Count);

            r[maxRows - 1].repaint();

        }

        if (!ShiftKeyPressed) selectedIndex = undefined;

        rowDrag = fileDrag = makeSelectionDrag = linkToLastItem = selectWithDrag = false;

        //--->

        plman.SetActivePlaylistContext();

        if (actionNotAllowed) {
            window.SetCursor(IDC_ARROW);
            actionNotAllowed = false;
        }

        break;

    case ("on_mouse_leave"):

        for (var i = 0; r[i]; i++) {

            if (r[i].state != 0) {

                if (r[i].b) {
                    for (var j = 0; r[i].b[j]; j++) {

                        r[i].b[j].changeState(0);

                    }
                }

                r[i].changeState(0);

            }

        }

        selectedIndex = oldRow = thisRow = undefined;

        break;

    }

}
// =================================================== //

function Row(x, y, w, h, b) {

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.b = b;
    this.state = 0;

}
// =================================================== //
Row.prototype.mouseInThisRow = function (x, y) {

    return (this.x <= x) && (x <= this.x + this.w) && (this.y <= y) && (y <= this.y + this.h);

}
// =================================================== //
Row.prototype.repaint = function () {

    window.RepaintRect(this.x - 5, this.y - 5, this.w + 10, this.h + 10);

}
// =================================================== //
Row.prototype.changeState = function (state) {

    this.state = state;
    if (rowDrag || fileDrag) {
        this.repaint();
    }
    //this.state == 0 ? window.SetCursor(IDC_ARROW) : window.SetCursor(IDC_HAND);

}
// =================================================== //

function RowButton(x, y, w, h) {

    this.x = x;
    this.y = y;
    this.w = w;
    this.h = h;
    this.state = 0;

}
// =================================================== //
RowButton.prototype.mouseInThisRowButton = function (x, y) {

    return (this.x <= x) && (x <= this.x + this.w) && (this.y <= y) && (y <= this.y + this.h);

}
// =================================================== //
RowButton.prototype.repaint = function () {

    window.RepaintRect(this.x, this.y, this.w, this.h);

}
// =================================================== //
RowButton.prototype.changeState = function (state) {

    this.state = state;
    this.repaint();

    //this.state == 0 ? window.SetCursor(IDC_ARROW) : window.SetCursor(IDC_HAND);

}
// =============================================== //
var cuttedItems;
var cuttedItemsCount = 0;

function cut() {

    cuttedItems = plman.GetPlaylistSelectedItems(activeList);
    cuttedItemsCount = cuttedItems.Count;
    plman.RemovePlaylistSelection(activeList);

}
// =============================================== //
function paste() {

    if (cuttedItemsCount) {

        if (plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Count > 0) {
            plman.ClearPlaylistSelection(activeList);
            plman.InsertPlaylistItems(activeList, plman.GetPlaylistFocusItemIndex(activeList), cuttedItems, true);
        } else {
            plman.InsertPlaylistItems(activeList, playlistItemCount, cuttedItems, true);
        }
        cuttedItemsCount = 0;
    }
}
// =============================================== //
function on_mouse_rbtn_up(x, y) {

    if (mouseInScrollbar) {
        scrollbarMouseEventHandler(x, y);
        return true;
    }

    var metadb = utils.IsKeyPressed(VK_CONTROL) ? (fb.IsPlaying ? fb.GetNowPlaying() : fb.GetFocusItem()) : fb.GetFocusItem();

    var windowsVisualStyleEnabled = window.CreateThemeManager("WINDOW");
    var selected = plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Count;
    var selection = (selected > 1);
    var queueActive = plman.IsPlaybackQueueActive();
    var isAutoPlaylist = fb.IsAutoPlaylist(activeList);
    var playlistCount = fb.PlaylistCount;
    var sendToPlaylistId = 0;
    
    var cpm = window.CreatePopupMenu();
    var web = window.CreatePopupMenu();
    var ce = window.CreatePopupMenu();
    var ccmm = fb.CreateContextMenuManager();
    var appear = window.CreatePopupMenu();
    var sort = window.CreatePopupMenu();
    var lists = window.CreatePopupMenu();
    var send = window.CreatePopupMenu();
    var skip = window.CreatePopupMenu();
    var art = window.CreatePopupMenu();
    var group = window.CreatePopupMenu();

    if (utils.IsKeyPressed(VK_SHIFT)) {

        cpm.AppendMenuItem(MF_STRING, 1, "Restart");
        cpm.AppendMenuSeparator();
        cpm.AppendMenuItem(safeMode ? MF_GRAYED : MF_STRING, 2, "Configure script...");
        cpm.AppendMenuItem(MF_STRING, 3, "Configure...");
        cpm.AppendMenuItem(MF_STRING, 4, "Playlist Properties...");
        cpm.AppendMenuSeparator();

    }

    plman.SetActivePlaylistContext();

    fb.Isplaying && cpm.AppendMenuItem(MF_STRING, 5, "Show now playing");

    if (plman.PlaylistItemCount(plman.ActivePlaylist)) {

        cpm.AppendMenuItem(MF_STRING, 6, "Refresh all \tF5");
        cpm.AppendMenuItem(MF_STRING, 7, "Select all \tCtrl+A");
        if (selected) cpm.AppendMenuItem(isAutoPlaylist ? MF_GRAYED : MF_STRING, 8, "Remove from list \tDelete");
        if (queueActive) cpm.AppendMenuItem(MF_STRING, 9, "Flush playback queue");
        cpm.AppendMenuSeparator();
    }

    cpm.AppendMenuItem((plman.GetPlaylistSelectedItems(plman.ActivePlaylist).Count > 0) ? MF_STRING : MF_GRAYED, 10, "Cut \tCtrl+X");
    cpm.AppendMenuItem(cuttedItemsCount ? MF_STRING : MF_GRAYED, 11, "Paste \tCtrl+V");
    cpm.AppendMenuSeparator();
    if (plman.PlaylistItemCount(plman.ActivePlaylist)) {

        // -------------------------------------------------------------- // 
        //---> Collapse/Expand

        if (rowsInGroup) {
            ce.AppendMenuItem(MF_STRING, 20, "Collapse all");
            if (fb.ActivePlaylist == plman.PlayingPlaylist) ce.AppendMenuItem(MF_STRING, 21, "Collapse all but now playing");
            ce.AppendMenuItem(MF_STRING, 22, "Expand all");
            ce.AppendMenuSeparator();
            ce.AppendMenuItem(MF_STRING, 23, "Auto");
            ce.CheckMenuItem(23, autoExpandCollapseGroups);
            ce.AppendMenuItem(MF_STRING, 24, "Collapse on start");
            ce.CheckMenuItem(24, collapseOnStart);
            ce.AppendTo(cpm, MF_STRING | MF_POPUP, "Collapse/Expand");

        }
        // -------------------------------------------------------------- // 
        //---> Skip trak

        skip.AppendMenuItem(MF_STRING, 25, "Enable");
        skip.CheckMenuItem(25, enableSkip);
        skip.AppendMenuSeparator();
        skip.AppendMenuItem(enableSkip ? MF_STRING : MF_GRAYED, 26, "Rated less than 2");
        skip.AppendMenuItem(enableSkip ? MF_STRING : MF_GRAYED, 27, "Rated less than 3");
        skip.AppendMenuItem(enableSkip ? MF_STRING : MF_GRAYED, 28, "Rated less than 4");
        skip.AppendMenuItem(enableSkip ? MF_STRING : MF_GRAYED, 29, "Rated less than 5");
        skip.AppendTo(cpm, MF_STRING | MF_POPUP, "Skip");
        skip.CheckMenuRadioItem(26, 29, 24 + skipLessThan);
        // -------------------------------------------------------------- // 
        //---> Appearance

        appear.AppendTo(cpm, MF_STRING | MF_POPUP, "Appearance");
        appear.AppendMenuItem(MF_STRING, 31, "Show group info");
        appear.CheckMenuItem(31, showGroupInfo);
        appear.AppendMenuItem(componentPlayCount ? MF_STRING : MF_GRAYED, 32, "Show play count");
        appear.CheckMenuItem(32, showPlayCount);
        appear.AppendMenuItem(componentPlayCount ? MF_STRING : MF_GRAYED, 33, "Show rating");
        appear.CheckMenuItem(33, showRating);
        appear.AppendMenuItem(MF_STRING, 34, "Show focus item");
        appear.CheckMenuItem(34, showFocusItem);
        appear.AppendMenuItem(MF_STRING, 35, "Show queue item");
        appear.CheckMenuItem(35, showQueueItem);
        appear.AppendMenuItem(MF_STRING, 36, "Alternate row color");
        appear.CheckMenuItem(36, alternateRowColor);
        appear.AppendMenuItem(MF_STRING, 37, "Show scrollbar");
        appear.CheckMenuItem(37, showScrollbar);
        if (showScrollbar && windowsVisualStyleEnabled) {
            appear.AppendMenuItem(MF_STRING, 38, "Scrollbar use windows style");
            appear.CheckMenuItem(38, scrollbarUseWindowsVisualStyle);
        }
        appear.AppendMenuItem(MF_STRING, 39, "Show playlist info");
        appear.CheckMenuItem(39, showPlaylistInfo);
        appear.AppendMenuItem(MF_STRING, 40, "Show group header");
        appear.CheckMenuItem(40, showGroupHeader);
        art.AppendTo(appear, MF_STRING | MF_POPUP, "Album art");
        art.AppendMenuItem(MF_STRING, 41, "Show");
        art.CheckMenuItem(41, showAlbumArt);
        art.AppendMenuItem(showAlbumArt ? MF_STRING : MF_GRAYED, 42, "Auto");
        art.CheckMenuItem(42, autoAlbumArt);

        // -------------------------------------------------------------- //    
        // Grouping       
        group.AppendTo(cpm, MF_STRING | MF_POPUP, "Grouping");
        group.AppendMenuItem(MF_STRING, 50, "by artist");
        group.AppendMenuItem(MF_STRING, 51, "by artist / album");
        group.AppendMenuItem(MF_STRING, 52, "by artist / album / disc number");
        group.AppendMenuItem(MF_STRING, 53, "by path");
        group.AppendMenuItem(MF_STRING, 54, "by date");
        group.AppendMenuItem(MF_STRING, 55, "by user defined");
       
        if (groupedID !== undefined)
            group.CheckMenuRadioItem(50, 55, 50 + groupedID);
        // -------------------------------------------------------------- //    
        // Selection

        //---> Sort 
        sort.AppendMenuItem(MF_STRING, 60, "Sort by...");
        sort.AppendMenuItem(MF_STRING, 61, "Randomize");
        sort.AppendMenuItem(MF_STRING, 62, "Reverse");
        sort.AppendMenuItem(MF_STRING, 63, "Sort by album");
        sort.AppendMenuItem(MF_STRING, 64, "Sort by artist");
        sort.AppendMenuItem(MF_STRING, 65, "Sort by file path");
        sort.AppendMenuItem(MF_STRING, 66, "Sort by title");
        sort.AppendMenuItem(MF_STRING, 67, "Sort by track number");
        sort.AppendMenuItem(MF_STRING, 68, "Sort by date");
        sort.AppendTo(cpm, isAutoPlaylist ? MF_GRAYED : MF_STRING | MF_POPUP, selection ? "Sort selection" : "Sort");
        
        // -------------------------------------------------------------- //
        //---> Web links
        web.AppendMenuItem(MF_STRING, 80, "Google");
        web.AppendMenuItem(MF_STRING, 81, "Google Images");
        web.AppendMenuItem(MF_STRING, 82, "eCover");
        web.AppendMenuItem(MF_STRING, 83, "Wikipedia");
        web.AppendMenuItem(MF_STRING, 84, "YouTube");
        web.AppendMenuItem(MF_STRING, 85, "Last FM");
        web.AppendMenuItem(MF_STRING, 86, "Discogs");
        web.AppendTo(cpm, safeMode ? MF_GRAYED : MF_STRING | MF_POPUP, "Weblinks");
        // -------------------------------------------------------------- //
        //---> Send

        if (selected) {

            send.AppendMenuItem(MF_STRING, 100, "To top");
            send.AppendMenuItem(MF_STRING, 101, "To bottom");
            send.AppendMenuSeparator();
            send.AppendMenuItem(MF_STRING, 102, "Create New Playlist");
            send.AppendMenuSeparator();
            sendToPlaylistId = 103;
            for (var i = 0; i != playlistCount; i++) {
                send.AppendMenuItem((fb.IsAutoPlaylist(i) || i == activeList) ? MF_GRAYED : MF_STRING,
                    sendToPlaylistId + i,
                    fb.GetPlaylistName(i) + " [" + fb.PlaylistItemCount(i) + "]" + (fb.IsAutoPlaylist(i) ? " (Auto)" : "") + (i == plman.PlayingPlaylist ? " (Now Playing)" : ""));
            }
            send.AppendTo(cpm, MF_STRING | MF_POPUP, "Send selection");
        }
        
    }
    // -------------------------------------------------------------- //
    //---> Playlists
    var playlistsStartID = sendToPlaylistId + playlistCount;
    var playlistId = playlistsStartID+3;
    lists.AppendMenuItem(MF_STRING, playlistsStartID+1, "Playlist manager... \tCtrl+M");
    lists.AppendMenuSeparator();
    lists.AppendMenuItem(MF_STRING, playlistsStartID+2, "Create New Playlist");
    lists.AppendMenuSeparator();
    for (var i = 0; i != playlistCount; i++) {
        lists.AppendMenuItem(MF_STRING, playlistId + i, fb.GetPlaylistName(i).replace(/\&/g, "&&") + " [" + fb.PlaylistItemCount(i) + "]" + (fb.IsAutoPlaylist(i) ? " (Auto)" : "") + (i == plman.PlayingPlaylist ? " \t(Now Playing)" : ""));
    }
    lists.AppendTo(cpm, MF_STRING | MF_POPUP, "Playlists");

    // -------------------------------------------------------------- //
    //---> Context Menu Manager
    var contextId = playlistId + playlistCount;
    if (selected) {
        cpm.AppendMenuSeparator();
        ccmm.InitContext(plman.GetPlaylistSelectedItems(activeList));
        ccmm.BuildMenu(cpm, contextId, -1);
    }

    id = cpm.TrackPopupMenu(x, y);

    if (selected) ccmm.ExecuteByID(id - contextId);
    // -------------------------------------------------------------- //
    switch (id) {

    case 1:
        fb.RunMainMenuCommand("File/Restart");
        break;
    case 2:
        try {

            WshShell.Run("notepad.exe themes\\" + themeName + "\\Scripts\\Panel_List.js");

        } catch (e) {
            fb.trace(e)
        };
        break;
    case 3:
        window.ShowConfigure();
        break;
    case 4:
        window.ShowProperties();
        break;
    case 5:
        showNowPlaying();
        break;
    case 6:
        initList();
        break;
    case 7:
        selectAll();
        break;
    case 8:
        plman.RemovePlaylistSelection(activeList);
        break;
    case 9:
        plman.FlushPlaybackQueue();
        break;
    case 10:
        cut();
        break;
    case 11:
        paste();
        break;
        // -------------------------------------------------------------- // 
    case 20:
        //---> Collapse/Expand
        collapseExpand("collapse");
        displayFocusItem(plman.GetPlaylistFocusItemIndex(activeList));
        break;
    case 21:
        getPlayingGroupCollapseExpand();
        break;
    case 22:
        collapseExpand("expand");
        displayFocusItem(plman.GetPlaylistFocusItemIndex(activeList));
        break;
    case 23:
        autoExpandCollapseGroups = !autoExpandCollapseGroups;
        window.SetProperty("user.Auto Expand/Collapse Groups", autoExpandCollapseGroups);
        autoExpandCollapseGroups && getPlayingGroupCollapseExpand();
        break;
    case 24:
        collapseOnStart = !collapseOnStart;
        window.SetProperty("user.Collapse On Start", collapseOnStart);
        break;
        // -------------------------------------------------------------- // 
    case 25:
        enableSkip = !enableSkip;
        window.SetProperty("user.Skip Enable", enableSkip);
        break;
    case 26:
        skipLessThan = 2;
        window.SetProperty("user.Skip Less Than", skipLessThan);
        break;
    case 27:
        skipLessThan = 3;
        window.SetProperty("user.Skip Less Than", skipLessThan);
        break;
    case 28:
        skipLessThan = 4;
        window.SetProperty("user.Skip Less Than", skipLessThan);
        break;
    case 29:
        skipLessThan = 5;
        window.SetProperty("user.Skip Less Than", skipLessThan);
        break;
        // -------------------------------------------------------------- // 
        //---> Appearance
    case 31:
        showGroupInfo = !showGroupInfo;
        window.SetProperty("user.Show Group Info", showGroupInfo);
        repaintList();
        break;
    case 32:
        showPlayCount = !showPlayCount;
        window.SetProperty("user.Show Play Count", showPlayCount);
        repaintList();
        break;
    case 33:
        showRating = !showRating;
        window.SetProperty("user.Show Rating", showRating);
        repaintList();
        break;
    case 34:
        showFocusItem = !showFocusItem;
        window.SetProperty("user.Show Focus Item", showFocusItem);
        repaintList();
        break;
    case 35:
        showQueueItem = !showQueueItem;
        window.SetProperty("user.Show Queue Item", showQueueItem);
        repaintList();
        break;
    case 36:
        alternateRowColor = !alternateRowColor;
        window.SetProperty("user.Alternate Row Color", alternateRowColor);
        repaintList();
        break;
    case 37:
        showScrollbar = !showScrollbar;
        window.SetProperty("user.Show Scrollbar", showScrollbar);
        on_size();
        window.Repaint();
        break;
    case 38:
        scrollbarUseWindowsVisualStyle = !scrollbarUseWindowsVisualStyle;
        window.SetProperty("user.Scrollbar Use Windows Visual Style", scrollbarUseWindowsVisualStyle);
        refreshScrollbarStyle();
        break;
    case 39:
        showPlaylistInfo = !showPlaylistInfo;
        window.SetProperty("user.Show Playlist Info", showPlaylistInfo);
        if (showPlaylistInfo) initList();
        on_size();
        window.Repaint();
        break;
    case 40:
        showGroupHeader = !showGroupHeader;
        window.SetProperty("user.Show Group Header", showGroupHeader);
        initList();
        break;
    case 41:
        showAlbumArt = !showAlbumArt;
        window.SetProperty("user.Show Album Art", showAlbumArt);
        showAlbumArt && getAlbumArt();
        repaintList();
        break;
    case 42:
        autoAlbumArt = !autoAlbumArt;
        window.SetProperty("user.Auto Album Art", autoAlbumArt);
        showAlbumArt && getAlbumArt();
        repaintList();
        break;
        // -------------------------------------------------------------- //
        // Grouping
    case 50:
        groupFormat = gArtist;
        window.SetProperty("system.GroupBy", groupFormat);
        groupedID = 0;
        initList();
        break;
    case 51:
        groupFormat = gArtistAlbum;
        window.SetProperty("system.GroupBy", groupFormat);
        groupedID = 1;
        window.SetProperty("system.GroupedID",  groupedID);
        initList();
        break;
    case 52:
        groupFormat = gArtistAlbumDiscnumber;
        window.SetProperty("system.GroupBy", groupFormat);
        groupedID = 2;
        window.SetProperty("system.GroupedID",  groupedID);
        initList();
        break;
    case 53:
        groupFormat = gPath;
        window.SetProperty("system.GroupBy", groupFormat);
        groupedID = 3;
        window.SetProperty("system.GroupedID",  groupedID);
        initList();
        break;
    case 54:
        groupFormat = gDate;
        window.SetProperty("system.GroupBy", groupFormat);
        groupedID = 4;
        window.SetProperty("system.GroupedID",  groupedID);
        initList();
        break;
    case 55:
        groupFormat = gUserDefined;
        window.SetProperty("system.GroupBy", groupFormat);
        groupedID = 5;
        window.SetProperty("system.GroupedID",  groupedID);
        initList();
        break;
        // -------------------------------------------------------------- //      
    case 60:
        //---> Sort
        selection ? fb.RunMainMenuCommand("Edit/Selection/Sort/Sort by...") : fb.RunMainMenuCommand("Edit/Sort/Sort by...");
        break;
    case 61:
        plman.SortByFormat(activeList, "", selection ? true : false);
        break;
    case 62:
        selection ? fb.RunMainMenuCommand("Edit/Selection/Sort/Reverse") : fb.RunMainMenuCommand("Edit/Sort/Reverse");
        break;
    case 63:
        plman.SortByFormat(activeList, "%album%", selection ? true : false);
        break;
    case 64:
        plman.SortByFormat(activeList, "%artist%", selection ? true : false);
        break;
    case 65:
        plman.SortByFormat(activeList, "%path%%subsong%", selection ? true : false);
        break;
    case 66:
        plman.SortByFormat(activeList, "%title%", selection ? true : false);
        break;
    case 67:
        plman.SortByFormat(activeList, "%tracknumber%", selection ? true : false);
        break;
    case 68:
        plman.SortByFormat(activeList, "%date%", selection ? true : false);
        break;
        // -------------------------------------------------------------- //
        // Web links
    case 80:
        link("google", metadb);
        break;
    case 81:
        link("googleImages", metadb);
        break;
    case 82:
        link("eCover", metadb);
        break;
    case 83:
        link("wikipedia", metadb);
        break;
    case 84:
        link("youTube", metadb);
        break;
    case 85:
        link("lastFM", metadb);
        break;
    case 86:
        link("discogs", metadb);
        break;       
         // -------------------------------------------------------------- //
        // Selection
    case 100: // Send to top
        plman.MovePlaylistSelection(activeList, -plman.GetPlaylistFocusItemIndex(activeList));
        break;
    case 101: // Send to bottom
        plman.MovePlaylistSelection(activeList, playlistItemCount - plman.GetPlaylistSelectedItems(activeList).Count);
        break;
    case 102:
        fb.CreatePlaylist(playlistCount, "");
        plman.InsertPlaylistItems(playlistCount, 0, plman.GetPlaylistSelectedItems(activeList), select = true);
        break;
        // -------------------------------------------------------------- //
    case playlistsStartID + 1:
        fb.RunMainMenuCommand("View/Playlist Manager");
        break;
    case playlistsStartID + 2:
        fb.CreatePlaylist(playlistCount, "");
        fb.ActivePlaylist = fb.PlaylistCount;
        break;

    }

    for (var i = 0; i != playlistCount; i++) {
        if (id == (playlistId + i)) fb.ActivePlaylist = i; // playlist switch
    }

    for (var i = 0; i < plman.PlaylistCount; i++) {
        if (id == (sendToPlaylistId + i)) {
            plman.ClearPlaylistSelection(i);
            plman.InsertPlaylistItems(i, plman.PlaylistItemCount(i), plman.GetPlaylistSelectedItems(activeList), select = true);
        }
    }

    cpm.Dispose();
    ccmm.Dispose();
    web.Dispose();
    ce.Dispose();
    appear.Dispose();
    sort.Dispose();
    lists.Dispose();
    send.Dispose();
    art.Dispose();
    group.Dispose();

    return true;
}

if (collapseOnStart) {
    collapseExpand("collapse");
    collapsedOnStart = true;
}