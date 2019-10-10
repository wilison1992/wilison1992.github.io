// https://observablehq.com/@wilson666/untitled/8@528
export default function define(runtime, observer) {
  const main = runtime.module();
  main.variable(observer("viewof object")).define("viewof object", ["form","html"], function(form,html){return(
form(html`<form>
  <div><font size="+2">&nbsp;&nbsp;&nbsp;&nbsp;Input Your Postcode</div>
  <div><label>&nbsp;&nbsp;&nbsp;&nbsp;<input name="postcode" type="text" value="3000" style="font-size:20px"></label></div>
 
</form> <br><br><br>`)
)});

main.variable("checkpos").define("checkpos", ["data","md"], function(data,md){return(
  function checkpos(object){
    if (object['postcode'] == data['Postcode']){
      return md`&nbsp;&nbsp;&nbsp;<font size="+2" color="green">Your Postcode is found! Explore your places!`
    }else if(object['postcode']== ""){
     return md`&nbsp;&nbsp;&nbsp;<font size="+2" color="red">Please Input Your Postcode`
    }else if (object['postcode'] < 4120 && object['postcode'] >= 2800){
      return md`&nbsp;&nbsp;&nbsp;<font size="+2" color="red">Your Postcode is not VIC Postcode. <br>&nbsp;&nbsp;&nbsp;But still near VIC, We
      provide closest postcode ${data['Postcode']} for reference`
    }else if (object['postcode'] > 4120 || object['postcode'] < 2800){
      return md`&nbsp;&nbsp;&nbsp;<font size="+2" color="red">Your Postcode is not VIC Postcode. <br>&nbsp;&nbsp;&nbsp;Please Input correct VIC Postcode`
    }else{
      return md`&nbsp;&nbsp;&nbsp;<font size="+2" color="red">Your Postcode is not not in our dataset. <br>&nbsp;&nbsp;&nbsp;Closest Postcode to you: ${data['Postcode']}
      <br>&nbsp;&nbsp;&nbsp;This visualization will based on ${data['Postcode']}`
    }
  }
  )});

    main.variable(observer()).define(["checkpos","object"], function(checkpos,object){return(
  checkpos(object)
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
      .style("width", "100%")
      .style("height", "100%")
      .style("font", "11px sans-serif");

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
         .style("font-size","18px")
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
d3.json('https://raw.githubusercontent.com/wilison1992/Project-Practice/master/React/circle_viz.json')
)});
main.variable("pos_list").define("pos_list", function(){return(
  ['3000', '3001', '3002', '3003', '3004', '3005', '3006', '3008', '3010', '3011', '3012', '3013', '3015', '3016', '3018', '3019', '3020', '3021', '3022', '3023', '3024', '3025', '3026', '3027', '3028', '3029', '3030', '3031', '3032', '3033', '3034', '3036', '3037', '3038', '3039', '3040', '3041', '3042', '3043', '3044', '3045', '3046', '3047', '3048', '3049', '3050', '3051', '3052', '3053', '3054', '3055', '3056', '3057', '3058', '3059', '3060', '3061', '3062', '3063', '3064', '3065', '3066', '3067', '3068', '3070', '3071', '3072', '3073', '3074', '3075', '3076', '3078', '3079', '3081', '3082', '3083', '3084', '3085', '3086', '3087', '3088', '3089', '3090', '3091', '3093', '3094', '3095', '3096', '3097', '3099', '3101', '3102', '3103', '3104', '3105', '3106', '3107', '3108', '3109', '3110', '3111', '3113', '3114', '3115', '3116', '3121', '3122', '3123', '3124', '3125', '3126', '3127', '3128', '3129', '3130', '3131', '3132', '3133', '3134', '3135', '3136', '3137', '3138', '3139', '3140', '3141', '3142', '3143', '3144', '3145', '3146', '3147', '3148', '3149', '3150', '3151', '3152', '3153', '3154', '3155', '3156', '3158', '3159', '3160', '3161', '3162', '3163', '3164', '3165', '3166', '3167', '3168', '3169', '3170', '3171', '3172', '3173', '3174', '3175', '3176', '3177', '3178', '3179', '3180', '3181', '3182', '3183', '3184', '3185', '3186', '3187', '3188', '3189', '3190', '3191', '3192', '3193', '3194', '3195', '3196', '3197', '3198', '3199', '3200', '3201', '3202', '3204', '3205', '3206', '3207', '3211', '3212', '3214', '3215', '3216', '3217', '3218', '3219', '3220', '3221', '3222', '3223', '3224', '3225', '3226', '3227', '3228', '3230', '3231', '3232', '3233', '3235', '3236', '3237', '3238', '3239', '3240', '3241', '3242', '3243', '3249', '3250', '3251', '3254', '3260', '3264', '3265', '3266', '3267', '3268', '3269', '3270', '3271', '3272', '3273', '3274', '3275', '3276', '3277', '3278', '3279', '3280', '3281', '3282', '3283', '3284', '3285', '3286', '3287', '3289', '3292', '3293', '3294', '3300', '3301', '3302', '3303', '3304', '3305', '3309', '3310', '3311', '3312', '3314', '3315', '3317', '3318', '3319', '3321', '3322', '3323', '3324', '3325', '3328', '3329', '3330', '3331', '3332', '3333', '3334', '3335', '3337', '3338', '3340', '3341', '3342', '3345', '3350', '3351', '3352', '3353', '3354', '3355', '3356', '3357', '3360', '3361', '3363', '3364', '3370', '3371', '3373', '3374', '3375', '3377', '3378', '3379', '3380', '3381', '3384', '3385', '3387', '3388', '3390', '3391', '3392', '3393', '3395', '3396', '3400', '3401', '3402', '3407', '3409', '3412', '3413', '3414', '3415', '3418', '3419', '3420', '3423', '3424', '3427', '3428', '3429', '3430', '3431', '3432', '3433', '3434', '3435', '3437', '3438', '3440', '3441', '3442', '3444', '3446', '3447', '3448', '3450', '3451', '3453', '3458', '3460', '3461', '3462', '3463', '3464', '3465', '3467', '3468', '3469', '3472', '3475', '3477', '3478', '3480', '3482', '3483', '3485', '3487', '3488', '3489', '3490', '3491', '3494', '3496', '3498', '3500', '3501', '3502', '3505', '3506', '3507', '3509', '3512', '3515', '3516', '3517', '3518', '3520', '3521', '3522', '3523', '3525', '3527', '3529', '3530', '3531', '3533', '3537', '3540', '3542', '3544', '3546', '3549', '3550', '3551', '3552', '3554', '3555', '3556', '3557', '3558', '3559', '3561', '3562', '3563', '3564', '3565', '3566', '3567', '3568', '3570', '3571', '3572', '3573', '3575', '3576', '3579', '3580', '3581', '3583', '3584', '3585', '3586', '3588', '3589', '3590', '3591', '3594', '3595', '3596', '3597', '3599', '3607', '3608', '3610', '3612', '3614', '3616', '3617', '3618', '3619', '3620', '3621', '3622', '3623', '3624', '3629', '3630', '3631', '3632', '3633', '3634', '3635', '3636', '3637', '3638', '3639', '3640', '3641', '3643', '3644', '3646', '3647', '3649', '3658', '3659', '3660', '3661', '3662', '3663', '3664', '3665', '3666', '3669', '3670', '3671', '3672', '3673', '3675', '3676', '3677', '3678', '3682', '3683', '3685', '3687', '3688', '3689', '3690', '3691', '3694', '3695', '3697', '3698', '3699', '3700', '3701', '3704', '3705', '3707', '3708', '3709', '3711', '3712', '3713', '3714', '3715', '3717', '3718', '3719', '3720', '3722', '3723', '3724', '3725', '3726', '3727', '3728', '3730', '3732', '3733', '3735', '3736', '3737', '3738', '3739', '3740', '3741', '3744', '3746', '3747', '3749', '3750', '3751', '3752', '3753', '3754', '3755', '3756', '3757', '3758', '3759', '3760', '3761', '3762', '3763', '3764', '3765', '3766', '3767', '3770', '3775', '3777', '3778', '3779', '3781', '3782', '3783', '3785', '3786', '3787', '3788', '3789', '3791', '3792', '3793', '3795', '3796', '3797', '3799', '3800', '3802', '3803', '3804', '3805', '3806', '3807', '3808', '3809', '3810', '3812', '3813', '3814', '3815', '3816', '3818', '3820', '3821', '3822', '3823', '3824', '3825', '3831', '3832', '3833', '3835', '3840', '3841', '3842', '3844', '3847', '3850', '3851', '3852', '3853', '3854', '3856', '3857', '3858', '3859', '3860', '3862', '3864', '3865', '3869', '3870', '3871', '3873', '3874', '3875', '3878', '3880', '3882', '3885', '3886', '3887', '3888', '3889', '3890', '3891', '3892', '3893', '3895', '3896', '3898', '3900', '3902', '3903', '3904', '3909', '3910', '3911', '3912', '3913', '3915', '3916', '3918', '3919', '3920', '3921', '3922', '3923', '3925', '3926', '3927', '3928', '3929', '3930', '3931', '3933', '3934', '3936', '3937', '3938', '3939', '3940', '3941', '3942', '3943', '3944', '3945', '3946', '3950', '3951', '3953', '3954', '3956', '3957', '3958', '3959', '3960', '3962', '3964', '3965', '3966', '3967', '3971', '3975', '3976', '3977', '3978', '3979', '3980', '3981', '3984', '3987', '3988', '3990', '3991', '3992', '3995', '3996']
  )});
    main.variable("data").define("data", ["pos_list","postcode","data1"], function(pos_list,postcode,data1)
  {
    if (pos_list.indexOf(postcode) >= 0){
    return data1[postcode]
    }else{
    let i = 0;
    while (i < 99999) {
    i++;
    if (pos_list.indexOf(String(Number(postcode) -i)) >= 0){
    return data1[String(Number(postcode) -i)]
    }}
      if (i = 9999){
    let i = 0;
    while (i < 9999) {
    i++;
    if (pos_list.indexOf(String(Number(postcode) +i)) >= 0){
    return data1[String(Number(postcode) +i)]
    }}
    } 
    }
  }
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
