import { Component, OnInit, ElementRef, ViewEncapsulation, Input, SimpleChanges, OnChanges } from '@angular/core';

import * as d3 from 'd3';

@Component({
    selector: 'app-area-chart',
    encapsulation: ViewEncapsulation.None,
    templateUrl: './area-chart.component.html',
    styleUrls: ['./area-chart.component.scss']
})

export class AreaChartComponent implements OnInit, OnChanges {
    @Input() transitionTime = 1000;
    @Input() xmax = 5;
    @Input() ymax = 40000;
    @Input() hticks = 60;
    @Input() data: any[];
    @Input() showLabel = 1;
    hostElement; // Native element hosting the SVG container
    svg; // Top level SVG element
    g; // SVG Group element
    colorScale; // D3 color provider
    x; // X-axis graphical coordinates
    y; // Y-axis graphical coordinates
    colors = d3.scaleOrdinal(d3.schemeCategory10);
    bins; // Array of frequency distributions - one for each area chaer
    paths; // Path elements for each area chart
    area; // For D3 area function
    histogram; // For D3 histogram function

    constructor(private elRef: ElementRef) {
        this.hostElement = this.elRef.nativeElement;
    }

    ngOnInit() {
      this.data = [NEW, STRIPPED, PROCESSED];
      this.updateChart(this.data);
    }

    ngOnChanges(changes: SimpleChanges) {
      this.updateChart(this.data)
        if (changes.data) {
            this.updateChart(changes.data.currentValue);
        }
    }

    private createChart(data: number[]) {
 
        this.removeExistingChartFromParent();

        this.setChartDimensions();

        this.setColorScale();

        this.addGraphicsElement();

        this.createXAxis();

        this.createYAxis();

        // d3 area and histogram functions  has to be declared after x and y functions are defined
        this.area = d3.area()
            .x((datum: any) => this.x(datum.x))

            .y0(this.y(0))
            .y1((datum: any) => this.y(datum.y));


        //this.histogram = d3.histogram()
        //    .value((datum) => datum)
        //    .domain([0, this.xmax])
        //    .thresholds(this.x.ticks(this.hticks));
        //  
        // data has to be processed after area and histogram functions are defined
        //this.processData(data);

        this.createAreaCharts();

    }

    //private processData(data) {
    //    this.bins = [];
    //    data.forEach((row) => {
    //        this.bins.push(this.histogram(row))
    //    });
    //}

    private setChartDimensions() {
        let viewBoxHeight = 100;
        let viewBoxWidth = 200;
        this.svg = d3.select(this.hostElement).append('svg')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', '0 0 ' + viewBoxWidth + ' ' + viewBoxHeight);
    }

    private addGraphicsElement() {
        this.g = this.svg.append("g")
            .attr("transform", "translate(0,0)");
    }

    private setColorScale() {
        this.colorScale = d3.scaleOrdinal(d3.schemeCategory10);
        // Below is an example of using custom colors
        // this.colorScale = d3.scaleOrdinal().domain(["0","1","2","3"]).range(['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728']);
    }

    private createXAxis() {
        this.x = d3.scaleTime()
            .domain(d3.extent(this.data[0], function(d:any) { 
              return d.x; 
            }))
            .range([30, 170])
        this.g.append('g')
            .attr('transform', 'translate(0,90)')
            .attr("stroke-width", 0.5)
            .call(d3.axisBottom(this.x).tickSize(0).tickFormat(<any>''));

        this.g.append('g')
            .attr('transform', 'translate(0,90)')
            .style('font-size', '3')
            .style("stroke-dasharray", ("1,1"))
            .attr("stroke-width", 0.1)
            .call(d3.axisBottom(this.x).ticks(d3.timeDay.every(1)).tickSize(-80));

    }

    private createYAxis() {
        this.y = d3.scaleLinear()
            .domain([0, this.ymax])
            .range([90, 10]);
        this.g.append('g')
            .attr('transform', 'translate(30,0)')
            .attr("stroke-width", 0.5)
            .call(d3.axisLeft(this.y).tickSize(0).tickFormat(<any>''));
        this.g.append('g')
            .attr('transform', 'translate(30,0)')
            .style("stroke-dasharray", ("1,1"))
            .attr("stroke-width", 0.1)
            .call(d3.axisLeft(this.y).ticks(4).tickSize(-140).tickFormat(d3.format(".2s")))
            .style('font-size', '3');

        if (this.showLabel === 1) {
            this.g.append('text')
            .attr('text-anchor', 'middle')
            .attr('transform', 'translate(10,50) rotate(-90)')
            .style('font-size', 4)
            .text('Files');
        }
    }
    private createAreaCharts() {
        this.paths = [];
        this.data.forEach((row, index) => {
            this.paths.push(this.g.append('path')
                .datum(row)
                .attr('fill', this.colorScale('' + index))
                .attr("stroke-width", 0.1)
                .attr('opacity', 0.5)
                .attr('d', (datum: any) => this.area(datum))
                //move paths 0.5px to right in order to avoid x-axis overlapping
                .style('transform', 'translate(0.5px, 0px)')
            );
        });
    }

    public updateChart(data: number[]) {
        if (!this.svg) {
            this.createChart(data);
            return;
        }

        //this.processData(data);

        this.updateAreaCharts();

    }

    private updateAreaCharts() {
        this.paths.forEach((path, index) => {
            path.datum(this.data[index])
                .transition().duration(this.transitionTime)
                .attr('d', d3.area()
                    .x((datum: any) => this.x(datum.x))
                    .y0(this.y(0))
                    .y1((datum: any) => this.y(datum.y)));

        });
    }

    private removeExistingChartFromParent() {
        // !!!!Caution!!!
        // Make sure not to do;
        //     d3.select('svg').remove();
        // That will clear all other SVG elements in the DOM
        d3.select(this.hostElement).select('svg').remove();
    }
}

const NEW = [
    {
      y: 35019,
      x: new Date("2021-09-13 00:00:00")
    },
    {
      y: 14672,
      x: new Date("2021-09-14 00:00:00")
    },
    {
      y: 39409,
      x: new Date("2021-09-15 00:00:00")
    },
    {
      y: 20795,
      x: new Date("2021-09-16 00:00:00")
    },
    {
      y: 14401,
      x: new Date("2021-09-17 00:00:00")
    },
    {
      y: 32401,
      x: new Date("2021-09-18 00:00:00")
    },
    {
      y: 14401,
      x: new Date("2021-09-19 00:00:00")
    },
  ]
  
  const PROCESSED = [
    {
      y: 36210,
      x: new Date("2021-09-13 00:00:00")
    },
    {
      y: 10583,
      x: new Date("2021-09-14 00:00:00")
    },
    {
      y: 30013,
      x: new Date("2021-09-15 00:00:00")
    },
    {
      y: 33180,
      x: new Date("2021-09-16 00:00:00")
    },
    {
      y: 19960,
      x: new Date("2021-09-17 00:00:00")
    },
    {
      y: 12960,
      x: new Date("2021-09-18 00:00:00")
    },
    {
      y: 19960,
      x: new Date("2021-09-19 00:00:00")
    },
  ]
  
  const STRIPPED = [
    {
      y: 38110,
      x: new Date("2021-09-13 00:00:00")
    },
    {
      y: 19053,
      x: new Date("2021-09-14 00:00:00")
    },
    {
      y: 29335,
      x: new Date("2021-09-15 00:00:00")
    },
    {
      y: 34535,
      x: new Date("2021-09-16 00:00:00")
    },
    {
      y: 8158,
      x: new Date("2021-09-17 00:00:00")
    },
    {
      y: 4158,
      x: new Date("2021-09-18 00:00:00")
    },
    {
      y: 23158,
      x: new Date("2021-09-19 00:00:00")
    },
  
  ]