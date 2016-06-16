var Box = {};

(function($) {
  Box = {

    products: {
      bedProtection: {
        price: 12.92,
        cost: 5.69,
        label: "Bettschutz (Einmalgebrauch)",
        quantity: "30 Stück",
        image: "pg41bettschutz.png"
      },
      gloves: {
        price: 7.18,
        cost: 3.26,
        label: "Handschuhe",
        quantity: "100 Stück",
        image: "pg45-handschuhe.png"
      },
      handDesinfectant: {
        price: 8.21,
        cost: 2.28,
        label: "Flächendesinfektion",
        quantity: "500 ml",
        image: "pg54-sprayoff.png"
      },
      equipmentDesinfectant: {
        price: 6.16,
        cost: 2.01,
        label: "Händedesinfektion",
        quantity: "500 ml",
        image: "pg45-aseptoma.png"
      },
      mouthCover: {
        price: 7.18,
        cost: 1.61,
        label: "Mundschutz",
        quantity: "50 Stück",
        image: "pg45-mundschutz.png"
      },
      protectionGear: {
        price: 13.34,
        cost: 5.68,
        label: "Schutzschürze",
        quantity: "100 Stück / 1 Stück",
        image: "pg54-schurze.jpg"
      }
    },

    shipping: 4.95,

    healthInsuranceCap: 40,

    months: ["Jan","Feb","Mär","Apr","Mai","Jun","Jul","Aug","Sep","Okt","Nov","Dez"],

    init: function(){
      this.inernalCounter = 0;
      this.lastSuccessfullMargin = 1000;
      this.defaultState = {};
      for(var p in this.products){
        this.defaultState[p] = 0;
      }

      var storedState = this.getStoredState();
      var step = $("li.active").length;
      
      if(step === 0){
        this.clearStorage();
        this.activateAnimations();
      } else if(step === 1){
        this.initCalendar();
        this.restoreState(storedState);
        Box.calculate();
        if($(".boxes-tabs:visible").attr("id") === "standardBoxTab"){
          this.enableBoxSubmition(true);
        }
      } else if(step === 2){
        this.displayBoxInfo(storedState);
      } else if(step === 3) {
        this.displayBoxInfo(storedState);
        this.displaySubmittedInfo();
        this.clearStorage();
      }
    },

    activateAnimations: function(){
      $(document).scroll(function(){
        var scrollTop = $(this).scrollTop();
        var windowHeight = $(window).height();
        $(".circle").each(function(){
          var position = $(this).offset();
          if(position.top+$(this).height()/2 < scrollTop+windowHeight){
            $(this).addClass("animated fadeInDown");
          }
        });
      });
    },

    clearStorage: function(){
      localStorage.removeItem("_a_n");
      localStorage.removeItem("_ct_");
    },

    getQueryParam: function (name) {
      name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
      var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
        results = regex.exec(location.search);
        return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
    },

    displaySubmittedInfo: function(){
      $("#fullName").text(this.getQueryParam("f") + " " + this.getQueryParam("l"));
      $("#address").text(this.getQueryParam("a"));
      $("#phone").text(this.getQueryParam("t"));
      $("#ouid").text(this.getQueryParam("o"));
    },

    displayBoxInfo: function(state){
      var template = $(".row.item.box-item").remove();
      var container = $("#boxSideBarContent");
      var fields = Object.keys(this.products);
      var analysis = this.getAnalysis(state);
      var packingFactor = analysis.packingFactor || 1;
      for(var p in state){
        if(state[p] == 0 || !fields.includes(p)){
          continue;
        }
        var item = template.clone()
        item.find("img").attr("src",this.templateURL+"/img/products/"+this.products[p].image);
        item.find(".product-tittle h5").text(this.products[p].label);
        item.find(".product-tittle p").text(this.products[p].quantity);
        item.find(".product-tybe strong span").text(state[p]*packingFactor);
        container.append(item);
      }
      var totalPrice = Math.min(Math.round(analysis.beforePrice),this.healthInsuranceCap);
      $("#totalBoxCost").html(0+"&euro;");
      $("#cyclesCount").text(packingFactor);
      var date = new Date();
      $("#shipmentStartDate").text(this.months[(date.getMonth())%12] + " " + date.getFullYear());
    },

    initCalendar: function(){
      var today = new Date(); 
      var calendar = $("#monthsWrapper").empty();
      for(var i = 0 ; i < 12; i++){
        calendar.append($('<span>'+this.months[(today.getMonth()+i)%12]+'</span>'));
      }
      $("#calendarStartMonth").text(this.months[(today.getMonth())%12]);
      $("#calendarYear").text(today.getFullYear());
    },

    updateCalendarCycles: function(cycle){
      $("#monthsWrapper span").each(function(index,element){
        var element = $(element);
        if(index%cycle === 0){
          element.addClass("delivery-day");
        } else {
          element.removeClass("delivery-day"); 
        }
      });
      $(".packingFactorValue").text(cycle);
    },

    getAnalysis: function(chosenProducts){
      var totalPrice = 0;
      var totalCost = 0;
      var fields = Object.keys(this.products);
      for(var p in chosenProducts){
        if(!fields.includes(p)){
          continue;
        }
        totalPrice += this.products[p].price*chosenProducts[p]
        totalCost += this.products[p].cost*chosenProducts[p]
      }

      var packingFactor = this.healthInsuranceCap/totalPrice;

      var revenue = Math.min(this.healthInsuranceCap, totalPrice);
      var margin = revenue-totalCost-this.shipping;

      var packageCosts = [];
      var packageRevenues = [];
      var packagePrices = [];
      var packageMargins = [];
      for(var i=Math.floor(packingFactor)||1,c=0;c<=1;i++,c++){
        packageCosts[c] = totalCost*i;
        packageRevenues[c] = Math.min(totalPrice*i, this.healthInsuranceCap);
        packagePrices[c] = totalPrice*i;
        packageMargins[c] = (packageRevenues[c]-packageCosts[c]-this.shipping)/i;
      }

      var selected = packageMargins[0] > packageMargins[1] ? 0 : 1;

      var analysis = {
        packingFactor: selected === 0 ? Math.floor(packingFactor) : Math.ceil(packingFactor),
        currentMargin: packageMargins[selected],
        currentRevenue: packageRevenues[selected],
        currentCost: packageCosts[selected],
        currentPrice: packagePrices[selected],
        beforeMargin: margin,
        beforeRevenue: revenue,
        beforeCost: totalCost,
        beforePrice: totalPrice
      }
      return analysis;
    },

    getSerializedData: function(form){
      var serializedData = form.serializeArray();
      var data = {};
      for(var s in serializedData){
        data[serializedData[s]["name"]] = serializedData[s]["value"];
      }
      return data;
    },

    enableBoxSubmition: function(flag){
      if(flag){
        $("#submitBox").removeAttr("disabled");
      } else {
        $("#submitBox").attr("disabled","disabled");
      }
    },

    calculate: function(){

      var data = this.getSerializedData($("#customBoxTab form"));

      analysis = this.getAnalysis(data);

      this.enableBoxSubmition(analysis.beforePrice !== 0);

      if(analysis.currentPrice > this.healthInsuranceCap && analysis.packingFactor === 0 && this.lastSuccessfullMargin > analysis.currentMargin){
        if(this.lastState){
          this.restoreState(this.lastState);
        } else {
          this.restoreState(this.defaultState);
          this.setBoxProgress(0);
        }
        return;
      }
      this.lastState = data;
      this.storeState(data);
      this.lastSuccessfullMargin = analysis.currentMargin;
      var packingFactor = analysis.packingFactor || 1;
      $("#customBoxCycles").val(packingFactor);
      this.updateCalendarCycles(packingFactor);
  
      this.setBoxProgress(analysis.beforePrice*100/this.healthInsuranceCap);
      this.updateBoxContent(data);
    },

    updateBoxContent: function(data){
      for(var c in data){
        var item = $("#"+c+"InBox");
        if(data[c] > 0){
          item.filter(":hidden").show().css("z-index",++this.inernalCounter);
        } else {
          item.hide();
        }
      }
    },

    storeState: function(data){
      localStorage.setItem("_a_n", btoa(JSON.stringify(data)));
    },

    getStoredState: function(){
      return (localStorage.getItem("_a_n") !== null && JSON.parse(atob(localStorage.getItem("_a_n")))) || this.defaultState;
    },

    restoreState: function(state){
      for(var s in state){
          $("#customBoxTab input[name="+s+"]").val(state[s]);
        }
        $("#customBoxTab .input-group").each(function(){
          Box.updateQuantityField($(this));
        });
        var selectedTab = localStorage.getItem('_ct_');
        if(selectedTab){
          this.switchToTab(atob(selectedTab));  
        }
    },

    switchToTab: function(id){
      $(".box-tab-selector").removeClass("active").filter("#"+id+"TabSelector").addClass("active");

      $(".boxes-tabs").hide();
      $("#"+id+"Tab").show();  
      if(id === "standardBox"){
        this.enableBoxSubmition(true);
      } else {
        this.calculate();
      }
      localStorage.setItem('_ct_',btoa(id));
    },

    quantityField: function(container){
      container.find('button[data-type="minus"]').click(function(){
        var input = container.find("input.input-number");
        input.val(parseInt(input.val(),10)- 1);
        Box.updateQuantityField(container);
        Box.calculate();
      });
      container.find('button[data-type="plus"]').click(function(){
        var input = container.find("input.input-number");
        input.val(parseInt(input.val(),10) + 1);
        Box.updateQuantityField(container);
        Box.calculate();
      });
      container.find('input.input-number').bind('input', function(){
        Box.updateQuantityField(container);
        Box.calculate();
      });
      //Box.updateQuantityField(container, 0);
    },

    updateQuantityField(container, overrideValue){
      var input = container.find("input.input-number");
      var minusButton = container.find('button[data-type="minus"]');
      var plusButton = container.find('button[data-type="plus"]');
      var value = typeof overrideValue !== "undefined" ? overrideValue : parseInt(input.val(),10);
      var min = parseInt(input.attr("min"),10);
      var max = parseInt(input.attr("max"),10);

      value = isNaN(value) ? min : value;


      if(value <= min){
        value = min;
        minusButton.attr("disabled","disabled");
      } else {
        minusButton.removeAttr("disabled");
      }

      if(value >= max){
        value = max;
        plusButton.attr("disabled","disabled");
      } else {
        plusButton.removeAttr("disabled");
      }

      input.val(value);
    },

    setBoxProgress: function(percentage){
      percentage = Math.round(percentage);
      $('.bar-percentage').each(function () {
        var progress = $(this);
        $(Box).stop().animate({_box_progress: percentage}, {
          duration: 500,
          easing:'linear',
          step: function() {
            // What todo on every count
            var pct = Math.round(Box._box_progress) + '%';
            var left = Math.min(-20+(293/100)*Box._box_progress,273);
            var display = Math.min(Box.healthInsuranceCap, Math.round(Box._box_progress*Box.healthInsuranceCap/100))
            progress.css('left',left+"px").html(display + "&euro;") && progress.siblings().children().css('width',pct);
          },
          done: function(){
            var display = Math.min(Math.round(percentage*Box.healthInsuranceCap/100),Box.healthInsuranceCap);
            progress.html( display + "&euro;"  );
          }
        });
      });

    },

    submitForm: function(){
      var form = $("#customBoxTab,#standardBoxTab").filter(":visible").find("form");
      this.storeState(this.getSerializedData(form));
      form.submit();
    }
  }

  $(function(){
      Box.init();
      console.log($("#homepageTooltipContent").wrap('<div>').parent().html());
      $("#homepageTooltip").tipso({
        content: $("#homepageTooltipContent").html()
      });

      $(".box-tab-selector").click(function(){ 
        Box.switchToTab($(this).data("boxType")); 
      });
      
      $(".input-group").each(function(){
        Box.quantityField($(this));
      });

      $("#modalSubmitButton").click(function(){
        Box.submitForm();
      });

      $("#submitBox").click(function(){
        var analysis = Box.getAnalysis(Box.lastState);
        if(analysis.beforePrice !== 0 || $(".boxes-tabs:visible").attr("id") === "standardBoxTab"){
          if($("#customBoxTab").is(":visible") && analysis.packingFactor > 1){
            $("#shippingCycles").modal("show");
          } else {
            Box.submitForm();
          }
        }
      });
  });
}(jQuery));
