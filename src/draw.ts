"use strict";

import * as d3 from "d3";


// stałe
const formatDat = d3.timeFormat("%d.%m.%Y")

// FUNKCJA SPRAWDZANIE DATY
export function isDataReady(options) {
    if(!options
    || !options.dataViews
    || !options.dataViews[0]
    || !options.dataViews[0].categorical
    || !options.dataViews[0].categorical.categories
    || !options.dataViews[0].categorical.categories[0].source)
    {
        return false;
    }
    return true;                         
}

////////////////// FUNKCJE RYSUJĄCE ////////////////////////

export function recting (data, x, y, barContainer, className, widthPoint, xPoint, ifShadow?, animate?) {
    // DEFINOWANIE BARSÓW
    const barx = barContainer
    .selectAll('rect.'+className)
    .data(data)
    ;
    // TWORZENIE BARSÓW
    barx.enter()
        .append('rect')
        .classed(className, true)
        .attr('height', y.bandwidth()) // szerokość baru
        .attr('width', widthPoint)
        .attr('y', dataPoint => y(dataPoint.category)) // zaczynamy od jakiego punktu y
        .attr('x', xPoint) // zaczynamy od jakiego punktu x
        .attr("filter", ifShadow ? "url(#dropshadow)": "")
        ;

    // POWTÓZENIE PRZY ODŚWIEŻENIU zmiana szerokości, wysokości okienek
    if (animate) {
        barx.transition()
            .ease(d3.easeSin)
            .duration(1000)
            .attr('height', y.bandwidth())
            .attr('width', widthPoint)
            .attr('y', dataPoint => y(dataPoint.category))
            .attr('x', xPoint)
            .attr("filter", ifShadow ? "url(#dropshadow)": "");
    } else {
        barx.attr('height', y.bandwidth())
            .attr('width', widthPoint)
            .attr('y', dataPoint => y(dataPoint.category))
            .attr('x', xPoint)
            .attr("filter", ifShadow ? "url(#dropshadow)": "");
            ;
    }        
    barx.exit().remove();
    return barx;
};


export function labeling (data, labelContainer, className, text, xPoint, yPoint, fill? ,sizeBold?, animate?, transform?) {
    const labelx = labelContainer
        .selectAll("text."+className)
        .data(data)
        ;
    labelx.enter()
        .append('text')
        .html(text)
        .classed(className, true)
        .attr("x", xPoint)
        .attr("y", yPoint)
        .attr("dy", ".36em")
        .attr('fill', fill) // tylko dla opisu zmienia ale .less nadpisuje kolor w pozostałych
        .style("font-weight", sizeBold)
        .attr("transform", transform)
        ;
    // POWTÓZENIE PRZY ODŚWIEŻENIU zmiana szerokości, wysokości okienek
    if (animate) {
    labelx.html(text)
        .attr('fill', fill)
        .transition()
        .ease(d3.easeSin)
        .duration(1000)
        .attr("x", xPoint)
        .attr("y", yPoint)
        .attr("dy", ".36em")
        .style("font-weight", sizeBold)
        .attr("transform", transform);
    } else {
    labelx
        .html(text)
        .attr("x", xPoint)
        .attr("y", yPoint)
        .attr("dy", ".36em")
        .attr('fill', fill)
        .style("font-weight", sizeBold)
        .attr("transform", transform);
    };
    labelx.exit().remove();
    return labelx;
};


export function lineing (data, lineContainer, className, x1, y1, x2, y2, fill?, animate?) {
    const linex = lineContainer
        .selectAll('line.'+className)
        .data(data)
        ;
    linex.enter()
        .append('line')
        .classed(className, true)
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', fill)
        ;
    // Powtórzenie
    if (animate) {
        linex.transition()
        .ease(d3.easeSin)
        .duration(1000)
        .attr("x1",x1)
        .attr("x2",x2)
        .attr('y1', y1)
        .attr('y2', y2)
        .attr('stroke', fill)
    } else {
        linex.attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .attr('stroke', fill)
        ;
    };
    linex.exit().remove();
    return linex;
};

export function symbols (dane, symbolContainer, mPatch, className, transform, fill?, animate?, strokeColor?) {
    const sym = symbolContainer
    .selectAll('path.'+className)
    .data(dane);
    sym.enter()
    .append("path") 
    .attr("d", mPatch) 
    .classed(className, true)
    .style('fill', fill)
    .attr("transform", transform)
    .style('stroke',strokeColor);
    if (animate) {
        sym.transition()
        .ease(d3.easeSin)
        .duration(1000)
        .attr("d", mPatch) 
        .attr("transform", transform)
        .style('fill', fill)
        .style('stroke',strokeColor);
    } else {
        sym.attr("d", mPatch) 
        .style('fill', fill)
        .attr("transform", transform)
        .style('stroke',strokeColor);
    };
    sym.exit().remove()
};







// RYSOWANIE LINIA Z STRZAŁKAMI
export function arrows (x,y,dane, lineContainer, labelContainer, symbolContainer, animate?) {
    // LINE
    lineing(dane, lineContainer, 'arrow', 
        d => x(new Date(d.start)), 
        d => y(d.pozY),
        d => x(new Date(d.end)), 
        d => y(d.pozY),
        d => d.color,
        animate
    );
    // // LABEL
    labeling(dane, labelContainer, "label_arrow",
        d => `<tspan dy=-0.2em>${d.text}<tspan>`, 
        d => x(new Date(d.start))+(x(new Date(d.end))-x(new Date(d.start)))/2,
        d => y(d.pozY),
        d => d.color,'',
        animate
    );
    // STRZAŁKI
        //arrLeft
    symbols(dane, symbolContainer, 'M 0 0 -6 3 0 6 -1.5 3', 'arrowL', 
        d => `translate(${x(new Date(d.start))+6},${y(d.pozY)-3})`,
        d => d.color,
        animate
    );
        //arrRight
    symbols(dane, symbolContainer, 'M 0 0 6 3 0 6 1.5 3', 'arrowR', 
        d => `translate(${x(new Date(d.end))-6},${y(d.pozY)-3})`,
        d => d.color,
        animate
    );
};


/// RYSOWANIE KAMIENIE MILOWE
export function km (x,y, dane, osSrodkowa, lineContainer, labelContainer, symbolContainer) {
    const sizeDiamond = 30;
    // LINE
    const lineKM = lineing(dane, lineContainer, 'km', d => x(new Date(d.value)), 
        d => d.nrY>-8? y(d.nrY)+13: y(d.nrY)-4,
        d => x(new Date(d.value)),
        d => d.nrY>-8? osSrodkowa-4:osSrodkowa+5,
        'grey',  //d => d.color,
        true
    );
    function dimSpan(label){
        let wordSpaces=label
        // console.log(wordSpaces, wordSpaces.length)
        for (let i=wordSpaces.length; i<10; i++) {
            if (i%2==0){
                wordSpaces='&nbsp;'+ wordSpaces
            }else{
                wordSpaces+='&nbsp;'
            };
        };
        // console.log(wordSpaces)
        return wordSpaces
    };
    // LABEL
    labeling(dane, labelContainer, "label_km",
        d =>`<tspan dy=0.4em>${dimSpan(d.label)}</tspan>${d.end==1?'<tspan style="fill: green" dy=-0.1em>✔</tspan>':""}
            <tspan dx=${-5}em dy=0.9em>${formatDat(new Date(d.value))}</tspan>`
            // +`<tspan x=${x(new Date(d.value))} dy=0.9em>${new Date(d.value).toLocaleDateString()}</tspan>`
    , 
        d => x(new Date(d.value)),
        d => y(d.nrY),
        d => d.color, //'rgba(41, 104, 9, 1)': 'rgba(53, 53, 53,0.8)'
        d => d.color == 'red' || d.color == '#15317E' ? 600 : 400,
        true
    );
    // SYMBOL KM
    const squqre = d3.symbol()
        .type(d3.symbolSquare).size(sizeDiamond);
    symbols(dane, symbolContainer, squqre, 'diamond', 
        d => `translate(${x(new Date(d.value))},${osSrodkowa}) rotate(-45)`,
        '',
        true,
        d => d.key=='kp_ot' || d.key=='kp_ok' ? "#15317E": '')
};