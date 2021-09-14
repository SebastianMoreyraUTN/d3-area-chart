import { Component, OnInit, ElementRef, ViewEncapsulation, Input, SimpleChanges, OnChanges } from '@angular/core';

import * as d3 from 'd3/index';

@Component({
  selector: 'app-area-chart',
  encapsulation: ViewEncapsulation.None,
  templateUrl: './area-chart.component.html',
  styleUrls: ['./area-chart.component.scss']
})

export class AreaChartComponent implements OnInit {
    @Input() transitionTime = 1000;
    @Input() xmax = 5;
    @Input() ymax = 40000;
    @Input() data: any[];
    @Input() showLabel = 1;
    hostElement; // Native element hosting the SVG container
    svg; // Top level SVG element
    g; // SVG Group element
    colorScale; // D3 color provider
    x; // X-axis graphical coordinates
    y; // Y-axis graphical coordinates
    colors = d3.scaleOrdinal(d3.schemeCategory10);
    paths; // Path elements for each area chart
    area; // For D3 area function
    histogram; // For D3 histogram function
    configuration:string = 'day'
    tipBoxRect: any;
    tooltip: any;
    tooltipLine: any;

    constructor(private elRef: ElementRef) {
        this.hostElement = this.elRef.nativeElement;
    }

    ngOnInit() {
      this.data = [NEW, STRIPPED, PROCESSED];
      this.updateChart(this.data);
    }

    createChart(data: number[]) {
        this.removeExistingChartFromParent();

        this.setChartDimensions();

        this.setColorScale();

        this.addGraphicsElement();

        this.createXAxis();

        this.createYAxis();

        this.area = d3.area()
            .x((datum: any) => this.x(datum.x))
            .y0(this.y(0))
            .y1((datum: any) => this.y(datum.y));


        this.createAreaCharts();

        this.tooltip = d3.select('#tooltip');
        this.tooltipLine = this.g.append('line');

        this.tipBoxRect = this.g.append('rect')
        .attr('id', 'rect-test')
        .attr('transform', 'translate(30.5,10)')
        .attr('width', 140)
        .attr('height', 80)
        .style('opacity', 0)

        this.tipBoxRect
          .on('mousemove', () => {
            let date = (this.x.invert(d3.mouse(d3.select('#rect-test' as any).node())[0])) as Date;
            date.setDate(date.getDate() + 1)
            date.setHours(date.getHours() + 12)
            let rows = []
            this.data.forEach((element:any[]) => {
              rows.push(...element.filter((value) => value.x.getDate() == date.getDate() && value.x.getMonth() == date.getMonth()))
            });


          this.tooltipLine.attr('stroke', 'black')
          .attr('x1', this.x(rows[0].x))
          .attr('x2', this.x(rows[0].x))
          .attr('y1', 10)
          .attr('y2', 90);
          
          this.tooltip.html('Test Records')
            .style('display', 'block')
            .style('left', d3.event.pageX + 20)
            .style('top', d3.event.pageY - 20)
            .selectAll()
            .data(rows).enter()
            .append('div')
            .style('color', d => d.color)
            .html(d => `${d.x.getDate()}-${d.x.getMonth()+1}` + ': ' + d.y);

            console.log(d3.event.pageX, d3.event.pageY )
          })

          
        
       
          .on('mouseout', () => {
            if (this.tooltip) this.tooltip.style('display', 'none');
            if (this.tooltipLine) this.tooltipLine.attr('stroke', 'none');
          });
        
      }

    removeTooltip() {

    }

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
        this.x =  
            d3.scaleTime()
            .domain(d3.extent(this.data[0], (d:any) => { 
              return d.x as Date; 
            }))
            .range([30, 170]);
        this.g.append('g')
            .attr('transform', 'translate(0,90)')
            .attr("stroke-width", 0.5)
            .call(d3.axisBottom(this.x).tickSize(0).tickFormat(<any>''));

        this.g.append('g')
            .attr('transform', 'translate(0,90)')
            .style('font-size', '3')
            .style("stroke-dasharray", ("1,1"))
            .attr("stroke-width", 0.1)
            .call(d3.axisBottom(this.x).ticks(this.configuration == 'day' ? d3.timeDay.every(1) : d3.timeMonth.every(1))
            .tickFormat(d3.timeFormat(this.configuration == 'day'? "%b-%d" : "%b-%y")).tickSize(-80))

    }

    private createYAxis() {
        this.y = d3.scaleLinear()
            .domain([0, this.ymax])
            .range([90, 10])
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
                .attr('class','test-class')
                .attr('fill', this.colorScale('' + index))
                .attr("stroke-width", 0.1)
                .attr('opacity', 0.5)
                .attr('d', (d: any) => this.area(d))
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

    changeData(configuration:string) {
      if(this.configuration == configuration) 
        return
      this.configuration = configuration;
      this.configuration == 'day' ? this.data=[NEW, STRIPPED, PROCESSED] : this.data = [NEW_M, STRIPPED_M, PROCESSED_M]; 
      this.createChart(this.data)
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
    {
      y: 0,
      x: new Date("2021-09-20 00:00:00")
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
    {
      y: 0,
      x: new Date("2021-09-20 00:00:00")
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
    {
      y: 0,
      x: new Date("2021-09-20 00:00:00")
    },
  
  ]

  const NEW_M = [
    {
      y: 35019,
      x: new Date("2021-09-01 00:00:00")
    },
    {
      y: 14672,
      x: new Date("2021-10-01 00:00:00")
    },
    {
      y: 39409,
      x: new Date("2021-11-01 00:00:00")
    },
    {
      y: 20795,
      x: new Date("2021-12-01 00:00:00")
    },
    {
      y: 14401,
      x: new Date("2022-01-01 00:00:00")
    },
    {
      y: 32401,
      x: new Date("2022-02-01 00:00:00")
    },
    {
      y: 14401,
      x: new Date("2022-03-01 00:00:00")
    },
    {
      y: 0,
      x: new Date("2022-04-01 00:00:00")
    },
    {
      y: 35019,
      x: new Date("2022-05-01 00:00:00")
    },
    {
      y: 14672,
      x: new Date("2022-06-01 00:00:00")
    },
    {
      y: 39409,
      x: new Date("2022-07-01 00:00:00")
    },
    {
      y: 20795,
      x: new Date("2022-08-01 00:00:00")
    },
    {
      y: 0,
      x: new Date("2022-09-01 00:00:00")
    },
  ]
  
  const PROCESSED_M = [
    {
      y: 36210,
      x: new Date("2021-09-01 00:00:00")
    },
    {
      y: 10583,
      x: new Date("2021-10-01 00:00:00")
    },
    {
      y: 30013,
      x: new Date("2021-11-01 00:00:00")
    },
    {
      y: 33180,
      x: new Date("2021-12-01 00:00:00")
    },
    {
      y: 19960,
      x: new Date("2022-01-01 00:00:00")
    },
    {
      y: 12960,
      x: new Date("2022-02-01 00:00:00")
    },
    {
      y: 19960,
      x: new Date("2022-03-01 00:00:00")
    },
    {
      y: 0,
      x: new Date("2022-04-01 00:00:00")
    },
    {
      y: 36210,
      x: new Date("2022-05-01 00:00:00")
    },
    {
      y: 10583,
      x: new Date("2022-06-01 00:00:00")
    },
    {
      y: 30013,
      x: new Date("2022-07-01 00:00:00")
    },
    {
      y: 33180,
      x: new Date("2022-08-01 00:00:00")
    },
    {
      y: 0,
      x: new Date("2022-09-01 00:00:00")
    },
  ]
  
  const STRIPPED_M = [
    {
      y: 38110,
      x: new Date("2021-09-01 00:00:00")
    },
    {
      y: 19053,
      x: new Date("2021-10-01 00:00:00")
    },
    {
      y: 29335,
      x: new Date("2021-11-01 00:00:00")
    },
    {
      y: 34535,
      x: new Date("2021-12-01 00:00:00")
    },
    {
      y: 8158,
      x: new Date("2022-01-01 00:00:00")
    },
    {
      y: 4158,
      x: new Date("2022-02-01 00:00:00")
    },
    {
      y: 23158,
      x: new Date("2022-03-01 00:00:00")
    },
    {
      y: 0,
      x: new Date("2022-04-01 00:00:00")
    },
    {
      y: 34535,
      x: new Date("2022-05-01 00:00:00")
    },
    {
      y: 8158,
      x: new Date("2022-06-01 00:00:00")
    },
    {
      y: 4158,
      x: new Date("2022-07-01 00:00:00")
    },
    {
      y: 23158,
      x: new Date("2022-08-01 00:00:00")
    },
    {
      y: 0,
      x: new Date("2022-09-01 00:00:00")
    },
  
  ]