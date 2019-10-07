// https://observablehq.com/@wilson666/untitled/8@528
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer()).define(["md"], function(md){return(
md `Introduction:   
Soil Types： what could be my soil typeFlora?  
Flora：Which plant type are most common in my area?  
Rain: What is suitable rainfall for my plants? 
`
)});
  main.variable(observer("viewof object")).define("viewof object", ["form","html"], function(form,html){return(
form(html`<form>
  <div>Input Your Postcode</div>
  <div><label><input name="postcode" type="text" value="3000"></label></div>
 
</form>`)
)});
  main.variable("object").define("object", ["Generators", "viewof object"], (G, _) => G.input(_));
  main.variable("postcode").define("postcode", ["object"], function(object){return(
object['postcode']
)});
  main.variable("form").define("form", ["html","formValue"], function(html,formValue){return(
function form(form) {
  const container = html`<div>${form}`;
  form.addEventListener("submit", event => event.preventDefault());
  form.addEventListener("change", () => container.dispatchEvent(new CustomEvent("input")));
  form.addEventListener("input", () => container.value = formValue(form));
  container.value = formValue(form);
  return container
}
)});
  main.variable("formValue").define("formValue", function(){return(
function formValue(form) {
  const object = {};
  for (const input of form.elements) {
    if (input.disabled || !input.hasAttribute("name")) continue;
    let value = input.value;
    switch (input.type) {
      case "range":
      case "number": {
        value = input.valueAsNumber;
        break;
      }
      case "date": {
        value = input.valueAsDate;
        break;
      }
      case "radio": {
        if (!input.checked) continue;
        break;
      }
      case "checkbox": {
        if (input.checked) value = true;
        else if (input.name in object) continue;
        else value = false;
        break;
      }
      case "file": {
        value = input.multiple ? input.files : input.files[0];
        break;
      }
    }
    object[input.name] = value;
  }
  return object;
}
)});
  main.variable(observer("chart")).define("chart", ["partition","data","d3","DOM","width","color","arc","format","radius"], function(partition,data,d3,DOM,width,color,arc,format,radius)
{
  const root = partition(data);

  root.each(d => d.current = d);

  const svg = d3.select(DOM.svg(width, width))
      .style("width", "50%")
      .style("height", "auto")
      .style("font", "10px sans-serif");

  const g = svg.append("g")
      .attr("transform", `translate(${width / 2},${width / 2})`);

  const path = g.append("g")
    .selectAll("path")
    .data(root.descendants().slice(1))
    .enter().append("path")
      .attr("fill", d => { while (d.depth > 1) d = d.parent; return color(d.data.name); })
      .attr("fill-opacity", d => arcVisible(d.current) ? (d.children ? 0.6 : 0.4) : 0)
      .attr("d", d => arc(d.current));

  path.filter(d => d.children)
      .style("cursor", "pointer")
      .on("click", clicked);

  path.append("title")
      .text(d => `${d.ancestors().map(d => d.data.name).reverse().join("/")}\n${format(d.value)}`);
  
  const label = g.append("g")
      .attr("pointer-events", "none")
      .attr("text-anchor", "middle")
      .style("user-select", "none")
    .selectAll("text")
    .data(root.descendants().slice(1))
    .enter().append("text")
      .attr("dy", "0.35em")
      .attr("fill-opacity", d => +labelVisible(d.current))
      .attr("transform", d => labelTransform(d.current))
      .text(d => d.data.name);

  const parent = g.append("circle")
      .datum(root)
      .attr("r", radius)
      .attr("fill", "none")
      .attr("pointer-events", "all")
      .on("click", clicked);

  function clicked(p) {
    parent.datum(p.parent || root);

    root.each(d => d.target = {
      x0: Math.max(0, Math.min(1, (d.x0 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      x1: Math.max(0, Math.min(1, (d.x1 - p.x0) / (p.x1 - p.x0))) * 2 * Math.PI,
      y0: Math.max(0, d.y0 - p.depth),
      y1: Math.max(0, d.y1 - p.depth)
    });

    const t = g.transition().duration(750);
    
    // Transition the data on all arcs, even the ones that aren’t visible,
    // so that if this transition is interrupted, entering arcs will start
    // the next transition from the desired position.
    path.transition(t)
        .tween("data", d => {
          const i = d3.interpolate(d.current, d.target);
          return t => d.current = i(t);
        })
      .filter(function(d) {
        return +this.getAttribute("fill-opacity") || arcVisible(d.target);
      })
        .attr("fill-opacity", d => arcVisible(d.target) ? (d.children ? 0.6 : 0.4) : 0)
        .attrTween("d", d => () => arc(d.current));
    
    
    label.filter(function(d) {
        return +this.getAttribute("fill-opacity") || labelVisible(d.target);
      }).transition(t)
        .attr("fill-opacity", d => +labelVisible(d.target))
        .attrTween("transform", d => () => labelTransform(d.current))
        .on('end', function(d){ 
        g.append("svg:text")
         .style("font-size","14px")
         .attr("text-anchor", "middle")
         .text("Click here to go back")});

   // label.filter(function(d) {
    //    return +this.getAttribute("fill-opacity") || labelVisible(d.target);
    //  }).transition(t)
     //   .attr("fill-opacity", d => +labelVisible(d.target))
    //    .attrTween("transform", d => () => labelTransform(d.current));
    
  }
  
  function arcVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && d.x1 > d.x0;
  }

  function labelVisible(d) {
    return d.y1 <= 3 && d.y0 >= 1 && (d.y1 - d.y0) * (d.x1 - d.x0) > 0.03;
  }

  function labelTransform(d) {
    const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
    const y = (d.y0 + d.y1) / 2 * radius;
    return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
  }

  return svg.node();
}
);
  main.variable("data1").define("data1", ["d3"], function(d3){return(
d3.json('https://raw.githubusercontent.com/wilison1992/Project-Practice/master/React/cricle_viz.json')
)});
  main.variable("data").define("data", ["data1","postcode"], function(data1,postcode)
{
  return data1[postcode]}
);
  main.variable("partition").define("partition", ["d3"], function(d3){return(
data => {
  const root = d3.hierarchy(data)
      .sum(d => d.values)
      .sort((a, b) => b.value - a.value);
  return d3.partition()
      .size([2 * Math.PI, root.height + 1])
    (root);
}
)});
  main.variable("color").define("color", ["d3","data"], function(d3,data){return(
d3.scaleOrdinal().range(d3.quantize(d3.interpolateRainbow, data.children.length + 1))
)});
  main.variable("format").define("format", ["d3"], function(d3){return(
d3.format(",d")
)});
  main.variable("width").define("width", function(){return(
600
)});
  main.variable("radius").define("radius", ["width"], function(width){return(
width / 6
)});
  main.variable("arc").define("arc", ["d3","radius"], function(d3,radius){return(
d3.arc()
    .startAngle(d => d.x0)
    .endAngle(d => d.x1)
    .padAngle(d => Math.min((d.x1 - d.x0) / 2, 0.005))
    .padRadius(radius * 1.5)
    .innerRadius(d => d.y0 * radius)
    .outerRadius(d => Math.max(d.y0 * radius, d.y1 * radius - 1))
)});
  main.variable("d3").define("d3", ["require"], function(require){return(
require("d3@5")
)});
  return main;
}
