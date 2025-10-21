// Documentation
// https://developers.google.com/apps-script/reference/spreadsheet/sheet
// https://developers.google.com/apps-script/reference/calendar
// Based on : https://github.com/ryanrwatkins/Google-Sheet-to-Calendar/blob/master/script
// Useful : https://opengist.nshephard.dev/nshephard/a3a260ed0f1d4be78eea18df261532f0
// Settings
var commiteeEmails = [
  "nshephard@protonmail.com",
  "secretary.peakclimbingclub@gmail.com",
];
// Calendar
let calendar_id = {
  local:
    "3412ff22d718172b3eccf2e345bb09be43f8c46771e10dc29f9f8d085fa2a053@group.calendar.google.com",
  trips:
    "2f51a5bcf421937822c08f6fcbbde00ab453f958e1df1fdc277cac9256235034@group.calendar.google.com",
  test: "b8b90ae541e42bab2fd4b3ec1aecfb46a0589a43b413f2483b5591e6491f175b@group.calendar.google.com",
};
var local_cal =
  "3412ff22d718172b3eccf2e345bb09be43f8c46771e10dc29f9f8d085fa2a053@group.calendar.google.com";
var trips_cal =
  "2f51a5bcf421937822c08f6fcbbde00ab453f958e1df1fdc277cac9256235034@group.calendar.google.com";
var test_cal =
  "b8b90ae541e42bab2fd4b3ec1aecfb46a0589a43b413f2483b5591e6491f175b@group.calendar.google.com";

// Original spreadsheet with manually created columns, in time this will be updated to work with a spreadsheet that can
// be populated from a Google Form so people can add new events.
var sheet_ID = "14bFheHdIk8RrWQsDYKMBgmciu9zmjT80zzLd8skBSug";

// Form for local meets (column indexes starting from 1)
let local = {
  sheetName: "schedule",
  eventStart: 9,
  eventEnd: 10,
  eventName: 11,
  eventDetails: 12,
};

// Form for trips (column indexes starting from 1)
let trip = {
  sheetName: "trips",
  eventStart: 1,
  eventEnd: 2,
  eventName: 3,
  eventDetails: 4,
};

/**
 * onOpen Adds a menu to the Spreadsheet for running the script
 */
function onOpen() {
  var ui = SpreadsheetApp.getUi();
  ui.createMenu("Sync to Calendar")
    .addItem("Update Calendar", "schedule")
    .addToUi();
}

/**
 * schedule Schedule calendar events from Google Sheet
 * @param {str} cal_id Calendar ID to upload events to
 * @param {str} sheet_id Sheet ID to pull data from
 * @param {str} sheet_name_id Name of specific worksheet within to pull data from
 * @param {int} event_start_col Column containing event_start, adjacent columns MUST beare event_end, venue and
 * description. Indexing of columns starts at 1 in Google Sheets
 * @param {int} pause delay to use between adding events as the process is rate limited
 * @param {str} cal_name Name of calendar being updated (used in logging)
 */
function schedule(
  cal_id,
  sheet_id,
  sheet_name_id,
  event_start_col,
  pause,
  cal_name,
) {
  // The spreadsheet should have the columns
  //
  // 'event_start'
  // 'event_end'
  // 'venue'
  // 'description'
  //
  // ...as adjacent columns these are accessed via the event_start_col which is a numeric index (starting at 1) of the
  // column in the spreadsheet.

  // Get the spreadsheet and sheet/tab within, then get the calendar ID from the spreadsheet, and get the calendar
  var spreadsheet =
    SpreadsheetApp.openById(sheet_id).getSheetByName(sheet_name_id);
  // Get the event calendar based on the ID
  var eventCal = CalendarApp.getCalendarById(cal_id);

  // We get the data from 400 rows, for columns EventStart, and the next four columns to the right
  var topics = spreadsheet.getRange(1, event_start_col, 400, 4).getValues(); //Get the section of the spreadsheet we are using

  //Since we don't want duplicates, we first delete all the events and then we will replace them with the edited events

  //take care: Date function starts at 0 for the month (January=0)
  var fromDate = new Date(2025, 0, 1); //This is January 1, 2025 at 00h00'00"
  var toDate = new Date(2030, 0, 1); //This is January 1, 2022 at 00h00'00"
  /**
   * clearEvents Remove existing events from the calendar to avoid duplicates
   * @param {str} calendar CalendarApp object
   * @param {str} start Date object representing first date to start clearing events.
   * @param {str} end Date object representing last date to clear events from.
   */
  function clearEvents(calendar, start, end) {
    // console.log("calendar : ", calendar)
    // console.log("start    : ", start)
    // console.log("end      : ", end)
    var events = calendar.getEvents(start, end); //Get all events in the time range

    for (var i = 0; i < events.length; i++) {
      var ev = events[i]; // Get each individual event
      ev.deleteEvent(); // delete the event
    }
    console.log("[", cal_name, "] Removed all existing events.");
  }
  clearEvents(eventCal, fromDate, toDate);

  // now we create the new events one at a time
  for (x = 0; x < topics.length; x++) {
    var meetup = topics[x]; // Get each event, row, from the Sheet
    var begin = meetup[0]; // Assign a variable to each column
    var end = meetup[1];
    var venue = meetup[2];
    var description = meetup[3];

    // Break out if we don't have a venue
    if (venue == "") {
      console.log("[", cal_name, "] No more events to add for this calendar.");
      break;
    }
    // Create the event
    eventCal
      .createEvent(venue, new Date(begin), new Date(end))
      .addPopupReminder(30)
      .setDescription(description);
    console.log("[", cal_name, "] Event Added : ", venue, " (", begin, ")");
    // Pause briefly since you can only edit the ccalendar so many times per sec
    Utilities.sleep(pause);
    //}
  }
}

pause = 100;
// Test - will add events to a test calendar to check, although note that because events are cleared from the calendar first
// you should run both individually and check they populate the calendar. This isn't a problem with the actual calendars are
// local and trips populate separate calendars
// schedule(test_cal, sheet_ID, local["sheetName"], local["eventStart"], pause, "test");
// schedule(test_cal, sheet_ID, trip["sheetName"], trip["eventStart"], pause, "test");

// Actual - will add both local meets and trip/training events to the calendar.
schedule(
  local_cal,
  sheet_ID,
  local["sheetName"],
  local["eventStart"],
  pause,
  "Local Meets",
);
schedule(
  trips_cal,
  sheet_ID,
  trip["sheetName"],
  trip["eventStart"],
  pause,
  "Trips",
);
console.log(
  "PCC Local and Trips calendars have been updated. Enjoy the climbing!",
);
