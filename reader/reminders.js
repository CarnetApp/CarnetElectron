var RemindersDialog = function (element, reminders) {
    this.dialog = element
    this.dialog.getElementsByClassName("mdl-dialog__content")[0].innerHTML = ""
    for(var reminder of reminders){
        this.addItem(reminder)
    }
    this.dialog.getElementsByClassName("add")[0].onclick = function(){
        element.close()
        var reminderItemDialog = new ReminderItemDialog(document.getElementById("reminder-item"))
        reminderItemDialog.dialog.showModal()
    }
}

RemindersDialog.prototype.addItem = function (reminder) {
    var reminderDiv = document.createElement("div")
    reminderDiv.classList.add("reminder-item")
    var time = document.createElement("span")
    time.classList.add("hour")

    var d = new Date(reminder.time);
    time.innerHTML = d.toLocaleTimeString();
    reminderDiv.appendChild(time)

    if(reminder.frequency== "days-of-week"){

        for(var day of reminder.days){
            var dayDiv = document.createElement("span")
            dayDiv.classList.add("day")
            dayDiv.innerHTML = $.i18n(day)+" ";
            reminderDiv.appendChild(dayDiv)
        }
    }
    else {
        var date = document.createElement("span")
        date.classList.add("date")
        d = new Date(reminder.date);
        date.innerHTML = d.toLocaleDateString();

        var frequency = document.createElement("frequency")
        frequency.classList.add("frequency")
        frequency.innerHTML = $.i18n(reminder.frequency) + " - "
        reminderDiv.appendChild(frequency)
        reminderDiv.appendChild(date)

    }

    
    this.dialog.getElementsByClassName("mdl-dialog__content")[0].appendChild(reminderDiv)

}


var ReminderItemDialog = function (element, reminder) {
    this.dialog = element;
    this.reminder = reminder;
    if(reminder == undefined){
        this.reminder = {}
        this.reminder.frequency = "once"
        this.reminder.time = new Date().getTime()
        this.reminder.date = new Date().getTime()
        this.reminder.id = Utils.generateUID();

    }

    var itemDialog = this
    document.getElementById("date").onclick = function () {
        itemDialog.dialog.close()
        const picker = new MaterialDatetimePicker({
            default: moment(itemDialog.date),
        }).on('open', function () {
            //this.$('.js-show-clock').click()
            this.pickerEl.classList.add("reminder-calendar-picker");
            this.pickerEl.classList.add("reminder-date-picker");

            console.log('opened ' + this.scrimEl)
        })        //this.$('.js-show-clock').click()

            .on('submit', (val) => {
                itemDialog.setDate(val)
                itemDialog.dialog.showModal()
            })
            .on('cancel', () => {
                itemDialog.dialog.showModal()
            });
        picker.open();
    }
    document.getElementById("time").onclick = function () {
        itemDialog.dialog.close()
        const picker = new MaterialDatetimePicker({
            default: moment(itemDialog.time),
        }).on('open', function () {
            this.$('.js-show-clock').click()
            this.pickerEl.classList.add("reminder-date-picker");
        })
            .on('submit', (val) => {
                itemDialog.setTime(val)
                itemDialog.dialog.showModal()
            })
            .on('cancel', () => {
                itemDialog.dialog.showModal()
            });
        picker.open();
    }
    this.okButton = element.getElementsByClassName("ok")[0]
    this.okButton.onclick = function () {
        if (itemDialog.getFrequency() != undefined && itemDialog.getFrequency().length > 0){
            itemDialog.dialog.close()
            if(itemDialog.reminder != undefined){
                var i = 0;
                for(var reminder of writer.note.metadata.reminders){
                    if(itemDialog.reminder.id == reminder.id){
                        writer.note.metadata.reminders.splice(i, 1);
                    }
                    i++;
                }
            }
            itemDialog.reminder.frequency = itemDialog.getFrequency()
            if(itemDialog.reminder.frequency == "days-of-week")
                itemDialog.reminder.days = itemDialog.getDays();
            else   
                itemDialog.reminder.date = itemDialog.date;
            itemDialog.reminder.time = itemDialog.time
            if (writer.note.metadata.reminders == undefined)
                writer.note.metadata.reminders = []
            writer.note.metadata.reminders.push(itemDialog.reminder)
            writer.hasTextChanged = true;
            saveTextIfChanged()

        }
    }
    this.frequencyInput = document.getElementById("frequency")
    this.frequencyValueInput = document.getElementById("frequency-val")
    this.onFrequencyChanged();
    this.frequencyContainer = element.getElementsByClassName('frequency-container')[0]
    for (var opt of this.frequencyContainer.getElementsByClassName('mdl-menu__item')) {
        opt.onclick = function (event) {
            itemDialog.setFrequency(event.target.getAttribute("data-val"))
            

        }
    }
    this.setTime(this.reminder.time)
    this.setDate(this.reminder.date)
    this.setFrequency(this.reminder.frequency)
}
ReminderItemDialog.prototype.getDays = function(){
    var days = []
    for(var day of document.getElementsByName("days[]")){
        console.log(day.value + " "+ day.checked)
        if(day.checked)
            days.push(day.value)
    }
    return days

}
ReminderItemDialog.prototype.setFrequency = function (freq){
    this.frequencyValueInput.value = freq
    this.frequencyInput.value = $.i18n(freq)
    this.onFrequencyChanged();
}

ReminderItemDialog.prototype.getFrequency = function () {
    return this.frequencyValueInput.value;
}

ReminderItemDialog.prototype.onFrequencyChanged = function () {
    if (this.frequencyValueInput.value == "days-of-week") {
        document.getElementById("days-selector").style.display = "block";
        document.getElementById("date-container").style.display = "none";

    } else {
        document.getElementById("days-selector").style.display = "none";
        document.getElementById("date-container").style.display = "block";

    }
}

ReminderItemDialog.prototype.setDate = function (date) {
    var d = new Date(date);
    d.setHours(0)
    d.setMinutes(0)
    d.setSeconds(0)
    d.setMilliseconds(0)

    this.date = d.getTime();
    document.getElementById("date").value = d.toLocaleDateString();
}

ReminderItemDialog.prototype.setTime = function (time) {
    var d = new Date(time);
    d.setYear(0)
    d.setMonth(0)
    d.setDate(0)
    this.time = d.getTime();
    document.getElementById("time").value = d.toLocaleTimeString();
}

$(document).ready(
    function () {
        setTimeout(function () {
            //var reminderItemDialog = new ReminderItemDialog(document.getElementById("reminder-item"))
            //reminderItemDialog.dialog.showModal()

            var remindersDialog = new RemindersDialog(document.getElementById("reminders"), writer.note.metadata.reminders)
            remindersDialog.dialog.showModal()
        }, 3000)

    })

