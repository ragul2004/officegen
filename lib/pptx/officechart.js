// author vtloc
// date 2014Jan09
// author GradualStudent
// date 2015jan06
// This module's purpose is to transform
var _ = require('lodash') // replacing underscore to get merge function
var xmlBuilder = require('xmlbuilder')
var _chartSpecs = require('./charts')

function OfficeChart(chartInfo) {
  if (chartInfo instanceof OfficeChart) {
    return chartInfo
  }

  return {
    chartSpec: null, // Javascript object that represents the XML tree for the PowerPoint chart

    toXML: function () {
      return xmlBuilder
        .create(this.chartSpec, {
          version: '1.0',
          encoding: 'UTF-8',
          standalone: true
        })
        .end({ pretty: true, indent: '  ', newline: '\n' })
    },

    toJSON: function () {
      return this.chartSpec
    },

    getClass: function () {
      return 'OfficeChart'
    },

    // @brief Create XML representation of chart object
    // @param chartInfo {object}
    // {
    //   [
    //      title: 'eSurvey chart',
    //      data:  [ // array of series
    //      {
    //        name: 'Income',
    //        labels: ['2005', '2006', '2007', '2008', '2009'],
    //        values: [23.5, 26.2, 30.1, 29.5, 24.6],
    //       color: 'ff0000'
    //      }
    //    ],
    //   overlap:  "0",
    //   gapWidth: "150"
    // }

    initialize: function (chartInfo) {
      if (chartInfo.getClass && chartInfo.getClass() === 'OfficeChart') {
        return chartInfo
      }

      // overlap ["50"] is handled as an option within the chartbase
      // gapWidth ["150"] is handled as an option within the chartbase
      // valAxisCrossAtMaxCategory [true|false] is handled as an option within the chart base
      // catAxisReverseOrder [true|false] is handled as an option within the chart base

      this.chartSpec = OfficeChart.getChartBase(chartInfo) // get foundation XML for the chart type

      // Below are methods for handling options with more complex XML to mix in
      this.setData(chartInfo.data)
      this.setTitle(chartInfo.title || chartInfo.name)
      this.setValAxisTitle(chartInfo.valAxisTitle)
      this.setCatAxisTitle(chartInfo.catAxisTitle)
      this.setValAxisNumFmt(chartInfo.valAxisNumFmt)
      this.setValAxisScale(chartInfo.valAxisMinValue, chartInfo.valAxisMaxValue)
      this.setTextSize(chartInfo.fontSize)
      this.mergeChartXml(chartInfo.xml)
      this.setValAxisMajorGridlines(chartInfo.valAxisMajorGridlines)
      this.setValAxisMinorGridlines(chartInfo.valAxisMinorGridlines)

      return this
    },

    setTextSize: function (textSize) {
      if (textSize !== undefined) {
        var textRef = this._text(textSize)
        _.merge(this.chartSpec['c:chartSpace'], textRef)
      }
    },

    setTitle: function (title) {
      if (title !== undefined) {
        var titleRef = this._title(chartInfo.title || chartInfo.name)
        _.merge(this.chartSpec['c:chartSpace']['c:chart'], titleRef)
      }
    },

    setValAxisTitle: function (title) {
      if (title) {
        var titleRef = this._title(title)
        _.merge(
          this.chartSpec['c:chartSpace']['c:chart']['c:plotArea']['c:valAx'],
          titleRef
        )
      }
    },

    setCatAxisTitle: function (title) {
      if (title) {
        var titleRef = this._title(title)
        _.merge(
          this.chartSpec['c:chartSpace']['c:chart']['c:plotArea']['c:catAx'],
          titleRef
        )
      }
    },

    setValAxisNumFmt: function (format) {
      if (format !== undefined) {
        var numFmtRef = this._numFmt(format)
        _.merge(
          this.chartSpec['c:chartSpace']['c:chart']['c:plotArea']['c:valAx'],
          numFmtRef
        )
      }
    },

    setValAxisScale: function (min, max) {
      if (min !== undefined || max !== undefined) {
        var scalingRef = this._scaling(min, max)
        _.merge(
          this.chartSpec['c:chartSpace']['c:chart']['c:plotArea']['c:valAx'],
          scalingRef
        )
      }
    },

    mergeChartXml: function (xml) {
      if (xml !== undefined) {
        _.merge(this.chartSpec['c:chartSpace'], xml)
      }
    },

    setValAxisMajorGridlines: function (boolean) {
      if (boolean) {
        this.chartSpec['c:chartSpace']['c:chart']['c:plotArea']['c:valAx'][
          'c:majorGridlines'
        ] = {}
      }
    },
    setValAxisMinorGridlines: function (boolean) {
      if (boolean) {
        this.chartSpec['c:chartSpace']['c:chart']['c:plotArea']['c:valAx'][
          'c:minorGridlines'
        ] = {}
      }
    },

    setData: function (data) {
      var seriesDataRef

      if (data) {
        this.data = data

        // Mix in data series
        if (
          this.chartSpec['c:chartSpace']['c:chart']['c:plotArea']['c:lineChart']
        ) {
          seriesDataRef = this.chartSpec['c:chartSpace']['c:chart'][
            'c:plotArea'
          ]['c:lineChart']['#text']
        } else {
          if (
            this.chartSpec['c:chartSpace']['c:chart']['c:plotArea'][
              'c:areaChart'
            ]
          ) {
            seriesDataRef = this.chartSpec['c:chartSpace']['c:chart'][
              'c:plotArea'
            ]['c:areaChart']['#text']
          } else {
            if (
              this.chartSpec['c:chartSpace']['c:chart']['c:plotArea'][
                'c:barChart'
              ]
            ) {
              seriesDataRef = this.chartSpec['c:chartSpace']['c:chart'][
                'c:plotArea'
              ]['c:barChart']['#text']
            } else if (
              this.chartSpec['c:chartSpace']['c:chart']['c:plotArea'][
                'c:doughnutChart'
              ]
            ) {
              seriesDataRef = this.chartSpec['c:chartSpace']['c:chart'][
                'c:plotArea'
              ]['c:doughnutChart']['#text']
            } else if (
              this.chartSpec['c:chartSpace']['c:chart']['c:plotArea'][
                'c:lineChart'
              ]
            ) {
              seriesDataRef = this.chartSpec['c:chartSpace']['c:chart'][
                'c:plotArea'
              ]['c:lineChart']['#text']
            } else if (
              this.chartSpec['c:chartSpace']['c:chart']['c:plotArea'][
                'c:pieChart'
              ]
            ) {
              seriesDataRef = this.chartSpec['c:chartSpace']['c:chart'][
                'c:plotArea'
              ]['c:pieChart']['#text']
            } else {
              throw new Error(
                "Can't add data to chart that is not initialized or not a recognized type"
              )
            } // Endif.
          } // Endif.
        } // Endif.

        // the barChart/pieChart objects has other attributes too, so we push the series data on, not replace it
        if (chartInfo.data) {
          var seriesData = this.getSeriesRef(chartInfo.data)
          for (var i = 0; i < seriesData.length; i++) {
            seriesDataRef.push(seriesData[i])
          }
        }
      }
      return this
    },

    /**
     * Transform an array of string into an office's compliance structure
     *
     * @param region {string} The reference cell of the string, for example: $A$1.
     * @param stringArr {Array} An array of string, for example: ['foo', 'bar'].
     */
    _strRef: function (region, stringArr) {
      var obj = {
        'c:strRef': {
          'c:f': region,
          'c:strCache': function () {
            var result = {}

            result['c:ptCount'] = { '@val': stringArr.length }
            result['#text'] = []
            for (var i = 0; i < stringArr.length; i++) {
              result['#text'].push({
                'c:pt': { '@idx': i, 'c:v': stringArr[i] }
              })
            } // End of for loop.

            return result
          }
        }
      }

      return obj
    },

    /**
     * Transform an array of numbers into an office's compliance structure
     *
     * @param region {string} The reference cell of the string, for example: $A$1.
     * @param numArr {Array} An array of numArr, for example: [4, 7, 8].
     * @param formatCode {string} A string describe the number's format. Example: General.
     */
    _numRef: function (region, numArr, formatCode) {
      var obj = {
        'c:numRef': {
          'c:f': region,
          'c:numCache': {
            'c:formatCode': formatCode,
            'c:ptCount': { '@val': '' + numArr.length },
            '#text': function () {
              var result = []
              for (var i = 0; i < numArr.length; i++) {
                result.push({
                  'c:pt': { '@idx': i, 'c:v': numArr[i].toString() }
                })
              } // End of for loop.

              return result
            }
          }
        }
      }

      return obj
    },

    _numFmt: function (formatCode) {
      return {
        'c:numFmt': {
          '@formatCode': formatCode || 'General',
          '@sourceLinked': formatCode ? '0' : '1'
        }
      }
    },

    /**
     * Transform an array of string into an office's compliance structure
     *
     * @param colorArr {Array} An array of colorArr, for example: ['ff0000', '00ff00', '0000ff'].
     */
    _colorRef: function (colorArr) {
      var arr = []
      for (var i = 0; i < colorArr.length; i++) {
        arr.push({
          'c:dPt': {
            'c:idx': { '@val': i },
            'c:bubble3D': { '@val': 0 },
            'c:spPr': {
              'a:solidFill': {
                'a:srgbClr': { '@val': colorArr[i].toString() }
              }
            }
          }
        })
      } // End of for loop.

      return arr
    },

    /**
     * @brief Transform an array of string into an office's compliance structure
     *
     * @param row {number} Row index.
     * @param col {number} Col index.
     * @param isRowAbsolute {boolean} Will add $ into cell's address if this parameter is true.
     * @param isColAbsolute {boolean} Will add $ into cell's address if this parameter is true.
     */
    _rowColToSheetAddress: function (row, col, isRowAbsolute, isColAbsolute) {
      var address = ''

      if (isColAbsolute) {
        address += '$'
      } // Endif.

      // these lines of code will transform the number 1-26 into A->Z
      // used in excel's cell's coordination
      while (col > 0) {
        var num = col % 26
        col = (col - num) / 26
        address += String.fromCharCode(65 + num - 1)
      } // End of while loop.

      if (isRowAbsolute) {
        address += '$'
      } // Endif.

      address += row

      return address
    },

    // returns XML snippet for a chart dataseries
    _ser: function (serie, i) {
      var rc2a = this._rowColToSheetAddress // shortcut

      var serieData = {
        'c:ser': {
          'c:idx': { '@val': i },
          'c:order': { '@val': i },
          'c:tx': this._strRef('Sheet1!' + rc2a(1, 2 + i, true, true), [
            serie.name
          ]), // serie's value
          'c:invertIfNegative': { '@val': '0' },
          'c:cat': this._strRef(
            'Sheet1!' +
              rc2a(2, 1, true, true) +
              ':' +
              rc2a(2 + serie.labels.length - 1, 1, true, true),
            serie.labels
          ),
          'c:val': this._numRef(
            'Sheet1!' +
              rc2a(2, 2 + i, true, true) +
              ':' +
              rc2a(2 + serie.labels.length - 1, 2 + i, true, true),
            serie.values,
            'General'
          )
        }
      }

      if (serie.color) {
        serieData['c:ser']['c:spPr'] = {
          'a:solidFill': {
            'a:srgbClr': { '@val': serie.color }
          }
        }
      } else if (serie.schemeColor) {
        serieData['c:ser']['c:spPr'] = {
          'a:solidFill': {
            'a:schemeClr': { '@val': serie.schemeColor }
          }
        }
      } // Endif.

      if (serie.xml) {
        serieData['c:ser'] = _.merge(serieData['c:ser'], serie.xml)
      } // Endif.

      // for pie charts
      if (serie.colors) {
        serieData['c:ser']['#text'] = this._colorRef(serie.colors)
      } // Endif.

      return serieData
    },

    // returns XML snippet for a chart dataseries
    getSeriesRef: function (data) {
      return data.map(this._ser, this)
    },

    // returns XML snippet for axis number format e.g. "$0" for US currency, "0%" for percentages
    xmlValAxisFormat: function (formatCode) {
      return {
        'c:chartSpace': {
          'c:chart': {
            'c:plotArea': {
              'c:valAx': {
                'c:majorGridlines': {},
                'c:numFmt': {
                  '@formatCode': formatCode,
                  '@sourceLinked': '0'
                }
              }
            }
          }
        }
      }
    },

    // returns XML snippet for an axis scale
    // currently just min/max are supported
    /*
      <c:scaling><c:orientation val="minMax"/>
        <c:max val="24.0"/>
        <c:min val="24.0"/>
      </c:scaling>
    */
    _scaling: function (minValue, maxValue) {
      var ref = {
        'c:scaling': {
          'c:orientation': {
            '@val': 'minMax'
          }
        }
      }

      if (maxValue !== undefined) {
        ref['c:scaling']['c:max'] = {
          '@val': '' + (maxValue || '')
        }
      } // Endif.

      if (minValue !== undefined) {
        ref['c:scaling']['c:min'] = {
          '@val': '' + (minValue || '')
        }
      } // Endif.

      return ref
    },

    _text: function (textSize) {
      return {
        'c:txPr': {
          'a:bodyPr': {},
          'a:p': {
            'a:pPr': {
              'a:defRPr': {
                '@sz': textSize
              }
            },
            'a:endParaRPr': {
              '@lang': 'en-US'
            }
          }
        }
      }
    },

    // @brief returns XML snippet for an axis title
    _title: function (title) {
      if (typeof title === 'object') return title // assume it's an XML representations
      return {
        'c:title': {
          'c:tx': {
            'c:rich': {
              'a:bodyPr': {},
              'a:lstStyle': {},
              'a:p': {
                'a:pPr': {
                  'a:defRPr': {}
                },
                'a:r': {
                  'a:rPr': {
                    '@lang': 'en-US',
                    '@dirty': '0',
                    '@smtClean': '0'
                  },
                  'a:t': title
                },
                'a:endParaRPr': {
                  '@lang': 'en-US',
                  '@dirty': '0'
                }
              }
            }
          },
          'c:layout': {},
          'c:overlay': {
            '@val': '0'
          }
        }
      }
    }
  }.initialize(chartInfo)
}

OfficeChart.getChartBase = function (chartInfo) {
  var chartBase

  if (typeof chartInfo === 'string') {
    chartBase = _chartSpecs[chartInfo]()
  } else if (typeof chartInfo.renderType === 'string') {
    chartBase = _chartSpecs[chartInfo.renderType](chartInfo)
  } else if (chartInfo.xml) {
    chartBase = chartInfo.xml
  } else {
    throw new Error('invalid chart type')
  }
  // return deep copy so can create multiple charts from same base within one PowerPoint document
  return JSON.parse(JSON.stringify(chartBase))
}

module.exports = OfficeChart

/*
 // Column chart
 new OfficeChart({
  title: 'eSurvey chart',
  renderType: 'column',
  data: [ // array of series
    {
      name: 'Income',
      labels: ['2005', '2006', '2007', '2008', '2009'],
      values: [23.5, 26.2, 30.1, 29.5, 24.6],
      colors: ['ff0000', '00ff00', '0000ff', 'ffff00', '00ffff'] // optional
    },
    {
      name: 'Expense',
      labels: ['2005', '2006', '2007', '2008', '2009'],
      values: [18.1, 22.8, 23.9, 25.1, 25],
      colors: ['ff0000', '00ff00', '0000ff', 'ffff00', '00ffff'] // optional
    }
  ]
});

 // Pie chart
 new OfficeChart({
  title: 'eSurvey chart',
  renderType: 'pie',
  data: [ // array of series
    {
      name: 'Income',
      labels: ['2005', '2006', '2007', '2008', '2009'],
      values: [23.5, 26.2, 30.1, 29.5, 24.6],
      colors: ['ff0000', '00ff00', '0000ff', 'ffff00', '00ffff'] // optional
    }
  ]
});

 // Clustered bar chat
 new OfficeChart({
  title: 'eSurvey chart',
  renderType: 'group-bar',
  data: [ // array of series
    {
      name: 'Income',
      labels: ['2005', '2006', '2007', '2008', '2009'],
      values: [23.5, 26.2, 30.1, 29.5, 24.6],
      colors: ['ff0000', '00ff00', '0000ff', 'ffff00', '00ffff'] // optional
    }
  ]
});
*/
