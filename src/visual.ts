"use strict";

import "core-js/stable";
import "./../style/visual.less";
import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
//import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
//import VisualObjectInstance = powerbi.VisualObjectInstance;
//import DataView = powerbi.DataView;
//import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
//import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import { lineing, labeling, symbols, km, isDataReady } from "./draw";
import * as d3 from "d3";


export class Visual implements IVisual {
    private svg: d3.Selection<SVGElement, any, any, any>;
    private axisX: d3.Selection<SVGElement, any, any, any>;
    private axisXb: d3.Selection<SVGElement, any, any, any>;
    private axisXc: d3.Selection<SVGElement, any, any, any>;
    private axisXd: d3.Selection<SVGElement, any, any, any>;
    private axisY: d3.Selection<SVGElement, any, any, any>;
    private label: d3.Selection<SVGElement, any, any, any>;
    private symbol: d3.Selection<SVGElement, any, any, any>;
    private line: d3.Selection<SVGElement, any, any, any>;


    constructor(options: VisualConstructorOptions) {

        this.svg = d3.select(options.element).append('svg');
        this.axisX = this.svg.append('g');
        this.axisXb = this.svg.append('g');
        this.axisXc = this.svg.append('g');
        this.axisXd = this.svg.append('g');
        this.axisY = this.svg.append('g');
        this.label = this.svg.append('g');
        this.symbol = this.svg.append('g');
        // this.legend = this.svg.append('g');
        this.line = this.svg.append('g');

        d3.formatDefaultLocale({
            "decimal": ",",
            "thousands": " ",
            "grouping": [3],
            "currency": ["zł", ""]});
        d3.timeFormatDefaultLocale({
            "dateTime": "%d.%m.%Y",
            "date": "%d.%m.%Y",
            "time": "%H:%M:%S",
            "periods": ["AM", "PM"],
            "days": ["Niedziela", "Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota"],
            "shortDays": ["Nd", "Pon", "Wt", "Śr", "Czw", "Pt", "Sob"],
            "months": ["Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec", "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień"],
            "shortMonths": ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"]
          });
        
    };
    

    public update(options: VisualUpdateOptions) {
        
        // SPRAWDZENIE CZY SĄ DANE
        if (isDataReady(options) == false) {return};
        // DEFINIOWANIE STAŁYCH
        const margins = {top: 5, right: 20, bottom: 5, left: 20};
        const width = options.viewport.width; // lub 100%
        const height = options.viewport.height; // lub 100%
        // nazewnictwo kształtów
        const lineCon=this.line, labelCon=this.label, symbolCon=this.symbol
        const osSrodkowa = height/2-margins.bottom-margins.top
 

        ////////////////// POBÓR DANYCH //////////////////
        let exData = [];
        let okres = [];
        let rangeAxisDate = {};
        let kamienie = {};
        let nrY = [0,-1,-2,-3,-4,-5,-6,-7,-8,-9,-10,-11,-12,-13,-14,-15,-16,-17,-18,-19]
        let YBaza = [-1,-7,-3,-7,0,-2,-6,-4]
        let YPlan = [-19,-14,-12,-16,-18,-11,-17,-13]
        let nrYBaza = []
        let nrYPlan = []


        const categorialData = options.dataViews[0].categorical;
        const category = categorialData.categories[0];
        const dataValue= categorialData.values;
        

        for (let i = 0; i < category.values.length; i++) {
            kamienie = {}
            kamienie['label'] = category.values[i];
            for (let j = 0; j<dataValue.length; j++){
                if (j<1 ) {
                    if (i===0) {
                        okres.push(dataValue[j].values[i]) ; 
                    }
                } else if (j<3) {
                    if (i===0) {
                        let nameValue = Object.keys(categorialData.values[j].source.roles)[0]; // nazwa danych
                        rangeAxisDate[nameValue] = dataValue[j].values[i];       // zapis danych do słownika 
                    }
                } else {
                    let nameValue = Object.keys(categorialData.values[j].source.roles)[0]; // nazwa danych
                    kamienie[nameValue] = dataValue[j].values[i];      // zapis danych do słownika
                };
            };
            exData.push(kamienie)
        };



        // sprawdzenie okresu czy jest jeden okres
        if (okres.length>1) {
            this.svg.attr('width', 0).attr('height', 0);
            return;
        }


        for (let i=0; i<Math.ceil(exData.length/YBaza.length); i++){
            nrYBaza=nrYBaza.concat(YBaza)
            nrYPlan=nrYPlan.concat(YPlan)
        }


       
        // sortowanie po category(index)
        exData.sort((a,b)=> a.km_plan-b.km_plan);
        
        //////////////// FUNKCJE USTAWIANIE SKALI OSI DLA X i Y  /////////////////////////
        const y1 = this.axisY, x1=this.axisX, x2=this.axisXb, x3=this.axisXc , x4=this.axisXd, x5=this.symbol

        function dAxisY (axisY=y1){
            // OS Y
            const yband = exData.map(dataPoint => dataPoint.category)
                yband.unshift(...nrY)
               // yband.push(1,2,3,4,5) // pozostałe
            const y = d3.scaleBand()
                    .domain(yband)
                    .rangeRound([margins.top,height-margins.bottom])
                    .padding(0.2)
                    ;
            return y
            ;
        };

        function dAxisX(start, end, axisX=x1, axisXb=x2, axisXc=x3, axisXd=x4, symbolContainer=x5, animate?){
            // OS X
            const startDate = new Date(start);
            let rangeStart=new Date();
            rangeStart.setTime(startDate.getTime());
            rangeStart.setDate(rangeStart.getDate() - 31 );

            const endDate:Date = new Date(end);
            let rangeEnd=new Date();
            rangeEnd.setTime(endDate.getTime());
            rangeEnd.setDate(rangeEnd.getDate() + 51 );

            // Zakres osi X
            const rangeMonths = d3.timeMonths(rangeStart, rangeEnd, 2);
            const rangeMonths1 = d3.timeMonths(rangeStart, rangeEnd, 1);

            const x = d3.scaleTime()
                .domain([rangeStart, rangeEnd])
                .range([margins.left, width-(margins.right)])
                ;

            // USTAWIANIE OSI X
            const xAxis = d3.axisBottom(x)
            xAxis.tickValues(rangeMonths)
                .tickFormat(d3.timeFormat("%b'%y")) // format
                .ticks(4)
                .tickSize(5)
                .tickSizeOuter(0)
                ;
            const xAxis2 = d3.axisBottom(x)
            xAxis2.tickValues(rangeMonths1)
                .tickFormat(d3.timeFormat("")) // format
                .ticks(1)
                .tickSize(3)
                .tickSizeOuter(0)
                ;
            axisX.attr('transform', `translate(0,${osSrodkowa})`)
                .classed("xAxis", true).style("text-anchor", "start")    
                .transition().ease(d3.easeSin).duration(1000)
                .call(xAxis.bind(this))
                ;   
            axisXc.attr('transform', `translate(0,${osSrodkowa})`)
                .classed("xAxis2", true)
                .transition().ease(d3.easeSin).duration(1000)
                .call(xAxis2.bind(this))
                ;


            // // STRZAŁKI DLA OSI X
            symbols([rangeEnd], symbolContainer, 'M 0 0 12 6 0 12 3 6', 'arrowOsX1', 
            `translate(${x(rangeEnd)-6},${osSrodkowa-6})`);

            return x
        };
        
        //////////////// OBLICZANIE KAMIENIA/////////////////
        // Zamiania kamieni do wykresu wyświetlania
        let dKm = [];
                    
        // Start/Koniec
        for(let item of d3.entries(rangeAxisDate)) {
            dKm.push({
                label: item.key.toUpperCase(),
                value: item.value,
                end: 0,
                nrY: 0,
                color: 'black'
            })
        }


        let j = 0;
        for (let i = 0; i < exData.length; i++) {
            //Bazowe
            let item = exData[i];
            
            dKm.push({
                label: item['label'],
                value: item['km_baza'],
                end: 0,
                nrY: nrYBaza[i],
                color: 'black'
            })

            let planItem = {
                label: item['label'],
                value: item['km_plan'],
                end: item['procent']===1 ? 1 : 0,
                nrY: nrYPlan[i],
                color: item['procent']===1 ? 'green' : (okres[0]>item['km_plan'] ? 'red' : 'black')
            }
            dKm.push(planItem)

        };




        ////////////// OBSZAR ROBOCZY WYKRESU ////////////////
        const svg = this.svg.attr('width', width).attr('height', height);


        /////////////// KAMIENIE //////////////
        // WYŚWIETLENIE PIERWSZY RAZ KAMIENII

        var y = dAxisY();
        var x = dAxisX(rangeAxisDate['start'], d3.max([rangeAxisDate['koniec']]));
        km(x, y, dKm, osSrodkowa, lineCon, labelCon, symbolCon);

         // NAPISY BAZA PLAN HARMONOGRAM
        labeling([""], labelCon, "napis_baza",
            'BAZOWY', 0, 0, '','','', `translate(${15}, ${osSrodkowa/2+20}) rotate(-90)`
        );
        labeling([""], labelCon, "napis_plan",
            'AKTUALNY', 0, 0,'','','',`translate(${15}, ${osSrodkowa*1.5+10}) rotate(-90)`
        );
        labeling([""], labelCon, "napis_harm",
        'HARMONOGRAM', width/2, 5,'','','' );


        /////////////// OKRES //////////////
        // LINE
        lineing (okres, lineCon, 'okres1', d => x(new Date(d)), 0,
            d => x(new Date(d)), height,'',true
        );
        lineing (okres, lineCon, 'okres', d => x(new Date(d))-2, 0,
        d => x(new Date(d))-2, height,'',true
        );

    };
    
};