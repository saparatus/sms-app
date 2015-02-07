export default Ember.Object.create({
    Workbook: Ember.Object.extend({
        SheetNames: [],
        Sheets: {}
    }),
    settings: {
        sheetName: "Sheet1",
        modelList: true,
        templateOnly: false
    },
    getPromiseList: function(models) {
        var promises = [];
        promises.push(models.objectAt(0).getHeaderRow());
        if (this.settings.templateOnly) return promises;
        models.forEach(function(dataRow) {
            promises.push(dataRow.getDataRow());
        });
        return promises;
    },
    createDataFromModelArray: function(models) {
        if (!models) return {};
        if (!models instanceof Array) return {};
        var promises = this.getPromiseList(models);
        return new Promise(function(resolve) {
            Promise.all(promises).then(function(values) {
                var data = [];
                data.push(values[0]);
                if (values.length === 1) return data;
                for (var i = 1; i < values.length; i++) {
                    data.push(values[i]);
                }
                resolve(data);
            });
        });
    },
    createSheetFrom2DArray: function(data) {
        var ws = {};
        var range = {
            s: {
                c: 10000000,
                r: 10000000
            },
            e: {
                c: 0,
                r: 0
            }
        };
        for (var R = 0; R !== data.length; ++R) {
            for (var C = 0; C !== data[R].length; ++C) {
                if (range.s.r > R) range.s.r = R;
                if (range.s.c > C) range.s.c = C;
                if (range.e.r < R) range.e.r = R;
                if (range.e.c < C) range.e.c = C;
                var cell = {
                    v: data[R][C]
                };
                if (cell.v == null) continue;
                var cell_ref = XLSX.utils.encode_cell({
                    c: C,
                    r: R
                });
                if (typeof cell.v === 'number') cell.t = 'n';
                else if (typeof cell.v === 'boolean') cell.t = 'b';
                else if (cell.v instanceof Date) {
                    cell.t = 'n';
                    cell.z = XLSX.SSF._table[14];
                    cell.v = this.datenum(cell.v);
                } else cell.t = 's';
                ws[cell_ref] = cell;
            }
        }
        if (range.s.c < 10000000) ws['!ref'] = XLSX.utils.encode_range(range);
        return ws;
    },
    s2ab: function(s) {
        var buf = new ArrayBuffer(s.length);
        var view = new Uint8Array(buf);
        for (var i = 0; i !== s.length; ++i) view[i] = s.charCodeAt(i) & 0xFF;
        return buf;
    },
    exportToExcel: function(data, fileName, options) {
        Ember.$().extend(this.settings, options);
        if (!this.settings.modelList) {
            this.saveSpreadsheet(data, fileName);
            return;
        }
        this.createDataFromModelArray(data).then(function(dataArray) {
            this.saveSpreadsheet(dataArray, fileName);
        }.bind(this));
    },
    saveSpreadsheet: function(data, fileName) {
        var ws = this.createSheetFrom2DArray(data);
        var wb = this.Workbook.create();
        /* add ranges to worksheet */
        ws['!merges'] = [];
        /* add worksheet to workbook */
        wb.SheetNames.push(this.settings.sheetName);
        wb.Sheets[this.settings.sheetName] = ws;
        var wbout = XLSX.write(wb, {
            bookType: 'xlsx',
            bookSST: false,
            type: 'binary'
        });
        
        saveAs(new Blob([this.s2ab(wbout)], {
            type: "application/octet-stream"
        }), fileName || "export.xlsx");
    },
    datenum: function(v, date1904) {
        if (date1904) v += 1462;
        var epoch = Date.parse(v);
        return (epoch - new Date(Date.UTC(1899, 11, 30))) / (24 * 60 * 60 * 1000);
    }
});