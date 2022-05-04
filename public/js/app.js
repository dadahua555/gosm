$(function() {
    loginDisplay()
    function loginDisplay() {
        $(".container").css("display","none")
        $(".login").css("display","block")
    }
    function pageDisplay() {
        $(".container").css("display","block")
        $(".login").css("display","none")
    }

    //save token
    function  save_token(token){
        sessionStorage.setItem("token",token); //存储数据
    }

    //add botten fution
    $("#login-button").click(function () {
        var userName = $("#username").val();
        var pwd = $("#pwd").val();
        $.ajax({
            url: '/userLogin/?user=' + userName + '&password=' + pwd,
            method: 'POST',
            success: function(result) {
                if (result.success === true) {
                    swal({
                        title: 'Success',
                        text: '登录成功',
                        type: 'success'
                    });
                    save_token(result.token)
                    pageDisplay()
                } else {
                    swal({
                        title: 'Failure',
                        text: '登录失败',
                        type: 'error'
                    });
                    loginDisplay()
                }
            }
        });
    });

    //set token
    $.ajaxSetup({
        contentType: "application/x-www-form-urlencoded",
        beforeSend: function(xhr) {
            // 利用请求头携带token数据
            xhr.setRequestHeader('Auth-Token', sessionStorage.getItem('token'))
        }
    })

    function updateTable(services) {
        if (!services) {
            return;
        }
        services.sort(function (a, b) {
            if (a.status == b.status) {
                return a.name > b.name;
                //return a.grp > b.grp;
            }
            //return getStatusPriority(a.status) < getStatusPriority(b.status);
            return getStatusPriority(b.status) - getStatusPriority(a.status);
        });
        let groupset = new Set()
        var groupmap = new Map()
        groupmap.set("所有分组",0);
        var group=sessionStorage.getItem("group");
        if(group == null || group == ""){
           group = "所有分组"
        }
        var refreshsec=sessionStorage.getItem("refreshsec");
        if(refreshsec == null || refreshsec == ""){
           refreshsec = 5
        }

        document.getElementById("select-group").length=1;
        var table = $('#services-table');
        var tbody = $('<tbody></tbody>');
        for (var i in services) {
            var service = services[i];
            //alert(service.name+"  "+service.status);
            groupset.add(service.grp);
            if(groupmap.has(service.grp)){
               groupmap.set(service.grp,groupmap.get(service.grp) + 1);
            } else {
               groupmap.set(service.grp,1);
            }
            groupmap.set("所有分组",groupmap.get("所有分组")+1);
            if( group == "所有分组" || group == service.grp ) {
                var row = $('<tr data-id="' + service.id + '" data-enabled="' + service.enabled + '"></tr>');
                row.append('<td>' + service.name + '</td>');
                row.append('<td>' + service.protocol + '</td>');
                row.append('<td>' + service.host + '</td>');
                row.append('<td>' + (service.port ? service.port : 'null') + '</td>');
                row.append('<td>' + service.grp + '</td>');
                var change = "暂停"
                if ( service.enabled == '1' ) {
                    row.append('<td class="' + getStatusTextClass(service.status) + '">' + service.status + '</td>');1
                    row.append('<td>' + (service.status != 'OFFLINE' ? timeSince(new Date(service.uptime_start * 1000)) : 'N/A') + '</td>');
                    row.append('<td>' + ( (service.status == 'OFFLINE' || service.status == 'PENDING') ? formatDatestr(service.failtime_start * 1000) : 'N/A') + '</td>');
                } else {
                    change = "启用"
                    row.append('<td>' + '暂停探测' + '</td>');
                    row.append('<td>' + '暂停探测' + '</td>');
                    row.append('<td>' + '暂停探测' + '</td>');
                }
                row.append('<td>' + (service.enabled == '1' ? '是' : '否') + '</td>');
                row.append('<td><button class="btn btn-sm btn-success check-history">图表</button> <button class="btn btn-sm btn-warning edit-service">修改</button> <button class="btn btn-sm btn-danger delete-service">删除</button>&nbsp;<button class="btn btn-sm btn-warning change-enabled">'+change+'</button></td>');
                tbody.append(row);
            }
        }
        document.getElementById("select-group").options.add(new Option("所有分组"+"("+groupmap.get("所有分组")+")","所有分组"));
        for( var item of  groupset.values() ){
           document.getElementById("select-group").options.add(new Option(item+"("+groupmap.get(item)+")",item));
        }
        $("#select-group").val(group);
        $("#select-refresh").val(refreshsec);
        table.find('tbody').replaceWith(tbody);    

        //实现表头排序
    //做成插件的形式
   jQuery.fn.alternateRowColors = function() { 
     //隔行变色 奇数行                     
     $('tbody tr:odd', this).removeClass('even').addClass('odd'); 
         //隔行变色 偶数行
     $('tbody tr:even', this).removeClass('odd').addClass('even'); 
     return this;
   };
   $('table.myTable').each(function(){
         //将table存储为一个jquery对象
     var $table = $(this);   
         //在排序时隔行变色                    
     $table.alternateRowColors($table);          
     $('th', $table).each(function(column) {
       var findSortKey;
           //按字母排序
       if ($(this).is('.sort-alpha')) {       
         findSortKey = function($cell) {
           return $cell.find('sort-key').text().toUpperCase() + '' + $cell.text().toUpperCase();
         };
       } 
           //按数字排序
           else if ($(this).is('.sort-numeric')) {       
         findSortKey = function($cell) {
           var key = parseFloat($cell.text().replace(/^[^\d.]*/, ''));
           return isNaN(key) ? 0 : key;
         };
       } 
           //按日期排序
           else if ($(this).is('.sort-date')) {          
         findSortKey = function($cell) {
           return Date.parse('1 ' + $cell.text());
         };
       }
       if (findSortKey) {
       $(this).addClass('clickable').hover(function() { 
             $(this).addClass('hover'); 
           }, function() { 
             $(this).removeClass('hover'); 
           }).click(function() {
         //反向排序状态声明
         var newDirection = 1;
         if ($(this).is('.sorted-asc')) {
           newDirection = -1;
         }
         var rows = $table.find('tbody>tr').get(); //将数据行转换为数组
         $.each(rows, function(index, row) {
           row.sortKey = findSortKey($(row).children('td').eq(column));
         });
         rows.sort(function(a, b) {
           if (a.sortKey < b.sortKey) return -newDirection;
           if (a.sortKey > b.sortKey) return newDirection;
           return 0;
         });
         $.each(rows, function(index, row) {
           $table.children('tbody').append(row);
           row.sortKey = null;
         });
         $table.find('th').removeClass('sorted-asc').removeClass('sorted-desc');
         var $sortHead = $table.find('th').filter(':nth-child(' + (column + 1) + ')');
         //实现反向排序
         if (newDirection == 1) {
           $sortHead.addClass('sorted-asc');
          } 
                  else {
            $sortHead.addClass('sorted-desc');
          }
          //调用隔行变色的函数
          $table.alternateRowColors($table);
          //移除已排序的列的样式,添加样式到当前列
          $table.find('td').removeClass('sorted').filter(':nth-child(' + (column + 1) + ')').addClass('sorted');
          $table.trigger('repaginate');
        });
      }
    });
  });
    }
    
    function timeSince(date) {
        var seconds = Math.floor((new Date() - date) / 1000);
        var interval = Math.floor(seconds / 31536000);
        if (interval > 1) {
            return interval + " years";
        }
        interval = Math.floor(seconds / 2592000);
        if (interval > 1) {
            return interval + " months";
        }
        interval = Math.floor(seconds / 86400);
        if (interval > 1) {
            return interval + " days";
        }
        interval = Math.floor(seconds / 3600);
        if (interval > 1) {
            return interval + " hours";
        }
        interval = Math.floor(seconds / 60);
        if (interval > 1) {
            return interval + " minutes";
        }
        return Math.floor(seconds) + " seconds";
    }

    
    function getServices() {
        $.get('/services', function(services) {
            if (services.auth === false) {
                //swal( '未登录或者token过期' + '失败', 'error');
                loginDisplay()
                return
            }
            updateTable(services)
        });
        /*
        $.ajax({
            url: '/services/' + id,
            method: 'GET',
            success: function(service) {
                if (service.auth === false) {
                    console.log(service)
                    swal( '未登录或者token过期' + '失败', 'error');
                    loginDisplay()
                    save_token("")
                    return
                }

                var port = $('#edit-service-modal').find('input[name=port]').closest('.form-group');
                if (service.protocol != 'http' && service.protocol != 'https' && service.protocol != 'icmp') {
                    port.show();
                } else {
                    port.hide();
                }

                $('#edit-service-modal input[name=id]').val(service.id);
                $('#edit-service-modal input[name=name]').val(service.name);
                $('#edit-service-modal select[name=protocol]').val(service.protocol);
                $('#edit-service-modal input[name=host]').val(service.host);
                $('#edit-service-modal input[name=port]').val(service.port);
                $('#edit-service-modal input[name=grp]').val(service.grp);
                $('#edit-service-modal input[name=emails]').val(service.emails);
                $('#edit-service-modal').modal();
            },
            error: function (result) {
                console.log(result)
                swal( '未登录或者token过期' + '失败', 'error');
                loginDisplay()
                save_token("")
            }
        });
        */
    }

    function getStatusTextClass(status) {
        switch(status) {
            case 'ONLINE':
                return 'text-success';
            case 'PENDING':
                return 'text-warning';
            case 'OFFLINE':
                return 'text-danger';
            default:
                return '';
        }
    }

    function getStatusPriority(status) {
        switch(status) {
            case 'ONLINE':
                return 0;
            case 'PENDING':
                return 1;
            case 'OFFLINE':
                return 2;
            default:
                return 0;
        }
    }

    $('select[name=protocol]').on('change', function() {
        var port = $(this).closest('form').find('input[name=port]').closest('.form-group');
        if ($(this).val() != 'http' && $(this).val() != 'https' && $(this).val() != 'icmp') {
            port.show();
        } else {
            port.hide();
        }
    });

    $('#add-service-button').click(function() {
        $('#add-service-modal input').val('');
        $('#add-service-modal').modal();
    });

    $('#batch-add-button').click(function() {
        $('#batch-add-modal textarea').val('');
        $('#batch-add-modal').modal();
    });

    $('#batch-add-form').submit(function(e) {
        e.preventDefault();
        var servicestrs = $(this).find('textarea[name=services]').val();
        $('#batch-add-modal textarea').val('');
        if( servicestrs == "" ){
            swal({title:"添加失败",text:"输入内容为空，请重新输入！",type:"error"});
            return;
        } else {
                var restr="";
                servicestrs.split("\n").every( newservice => {
                      if ( newservice != "" ) {
                          recode=addService(newservice);
                          var name = newservice.substr(0,newservice.indexOf('||'));
                          if ( recode == "1" ) {
                             restr=restr+name+" --> "+"失败\n"
                          } else {
                             restr=restr+name+" --> "+"成功\n"
                          }
                          return true;
                      } else {
                          return false;
                      }
                  }          
                );
                swal("服务批量添加结果",restr);
                $.modal.close();
	        getServices();
        }
    });


    function addService(servicestr) {
        if( servicestr==null || servicestr == "" ){
            return 1;
        }
        strarray = servicestr.split('||');
        if(strarray.length == 6){
              var service = { 
                name: strarray[0],
                protocol: strarray[1],
                host: strarray[2],
                port: strarray[3],
                grp: strarray[4],
                emails: strarray[5],
              }
              switch(service.protocol) {
                  case 'icmp':
                  case 'ICMP':
                  case 'http':
                  case 'HTTP':
                  case 'https':
                  case 'HTTPS':
                     service.port = "";
                     service.protocol = service.protocol.toLowerCase();
                     break;
                  case 'tcp':
                  case 'TCP':
                     if( service.port == "3306" ) {
                       alert("拒绝添加<"+service.name+">，禁止对mysql数据库进行端口探测!");
                       return 1;
                     }
                     break;
                  default:
                     service.port = "";
              }
              $.ajax({
	          url: '/batchadd',
	          method: 'POST',
	          data: service,
	          success: function(result) {
                      if( result.success == true ) {
	                  //swal({
	                  //    title: 'Success',
	                  //    text: '服务添加成功',
	                  //    type: 'success'
	                  //});
                          return 0;
                      }
                      if (result.auth === false) {
                          swal( '未登录或者token过期' + '失败', 'error');
                          loginDisplay()
                      }
	          }
	      });
        } else {
            return 1;
        }
     }

    $('#services-table').on('click', '.edit-service', function() {
        var id = $(this).closest('tr').data('id');
        $.ajax({
            url: '/services/' + id,
            method: 'GET',
            success: function(service) {
                if (service.auth === false) {
                    console.log(service)
                    swal( '未登录或者token过期' + '失败', 'error');
                    loginDisplay()
                    return
                }

                var port = $('#edit-service-modal').find('input[name=port]').closest('.form-group');
                if (service.protocol != 'http' && service.protocol != 'https' && service.protocol != 'icmp') {
                    port.show();
                } else {
                    port.hide();
                }

                $('#edit-service-modal input[name=id]').val(service.id);
                $('#edit-service-modal input[name=name]').val(service.name);
                $('#edit-service-modal select[name=protocol]').val(service.protocol);
                $('#edit-service-modal input[name=host]').val(service.host);
                $('#edit-service-modal input[name=port]').val(service.port);
                $('#edit-service-modal input[name=grp]').val(service.grp);
                $('#edit-service-modal input[name=emails]').val(service.emails);
                $('#edit-service-modal').modal();
            },
            error: function (result) {
                console.log(result)
                swal( '未登录或者token过期' + '失败', 'error');
                loginDisplay()
            }
        });
    });

    $('#services-table').on('click', '.change-enabled', function() {
        var id = $(this).closest('tr').data('id');
        var enabled = $(this).closest('tr').data('enabled'); 
        var newenabled = ( enabled == '1' ? '0' : '1' )
        var tip = "暂停服务探测";
        if ( newenabled == '1' ) {
           tip = "启用服务探测";       
        }
        $.ajax({
            url: '/change?serviceID=' + id + '&enabled=' + newenabled,
            method: 'GET',
            success: function(result) {
                if (result.auth === false) {
                    swal( '未登录或者token过期' + '失败', 'error');
                    loginDisplay()
                    return
                }
                if( result.success == true ) {
                    swal( tip + '成功', 'success');
                    getServices();
                } else {
                    swal( tip + '失败', 'error');
                }
            }
        });
    });

    $('#services-table').on('click', '.check-history', function() {
        var id = $(this).closest('tr').data('id');
        var name = $(this).closest('tr').find("td:first-child").text();
        sessionStorage.setItem("serviceID",id);
        sessionStorage.setItem("serviceName",name);
        window.open('history/line.html');
    });

/*   $('#services-table').on('click', '.delete-service-bak', function() {
        var serviceName = $(this).closest('tr').find('td:first-child').text();
        var id = $(this).closest('tr').data('id');
        swal({
            title: '操作确认?',
            text: '确认删除服务 "' + serviceName + '"? 请输入密码，并点击<删除>按钮',
            content: "input",
            type: 'warning',
            showCancelButton: true,
            cancelButtonText: '取消',
            confirmButtonColor: '#DD6B55',
            confirmButtonText: '删除',
            closeOnConfirm: false
        },
        function(){
            $.ajax({
                url: '/services/' + id,
                method: 'DELETE',
                success: function() {
                    $('#services-table tr[data-id=1]').remove()
                    swal('Deleted', '服务 "' + serviceName + '" 已被删除', 'success');
                    window.location.reload();
                }
            });
        });
    });
*/
    $('#services-table').on('click', '.delete-service', function() {
        var serviceName = $(this).closest('tr').find('td:first-child').text();
        var id = $(this).closest('tr').data('id');
        swal({
            title: '删除确认',
            text: '删除服务 "' + serviceName + '"? 请输入密码',
            type: 'input',
            inputType: 'password',
            showCancelButton: true,
            cancelButtonText: '取消',
            confirmButtonColor: '#DD6B55',
            confirmButtonText: '删除',
            closeOnConfirm: false,
            inputPlaceholder: "请输入配置密码"
        },
        function ( inputValue ) { 
            $.ajax({
                url: '/services/' + id + '?input_password=' + inputValue,
                method: 'DELETE',
                success: function(result) {
                    if (result.auth === false) {
                        swal( '未登录或者token过期' + '失败', 'error');
                        loginDisplay()
                        return
                    }
                    if( result.success == true ) {
                        $('#services-table tr[data-id=1]').remove()
                        swal('Deleted', '服务 "' + serviceName + '" 已被删除', 'success');
                        window.location.reload();
                    } else {
                        swal({title:"删除失败",text:"密码校验不通过！",type:"error"});
                    }
                }
            });
        });
    });

    $('#add-service-form').submit(function(e) {
        e.preventDefault();
        var service = $(this).serialize();
        var name = $(this).find('input[name=name]').val();
        var host = $(this).find('input[name=host]').val();
        var protocol = $(this).find('input[name=protocol]').val();
        var port = $(this).find('input[name=port]').val();
        var grp = $(this).find('input[name=grp]').val();
        var emails = $(this).find('input[name=emails]').val();
        if( port == "3306" ) {
            alert("拒绝添加<"+name+">，禁止对mysql数据库进行端口探测!");
            return 1;
        }
        if( name == "" || host == "" || protocol == "" || grp == "" || emails == ""){
            alert("存在字段为空，请重新输入！");
            return 1;
        } else {
          $.modal.close();
          $.ajax({
            url: '/services',
            method: 'POST',
            data: service,
            success: function(result) {
                if (result.auth === false) {
                    swal( '未登录或者token过期' + '失败', 'error');
                    loginDisplay()
                    return
                }
                swal({
                    title: 'Success',
                    text: '服务 "' + name + '" 添加成功',
                    type: 'success'
                });
                getServices();     
            }
          });
        }
    });


    $('#edit-service-form').submit(function(e) {
        e.preventDefault();
        var service = $(this).serialize();
        var id = $(this).find('input[name=id]').val();
        var name = $(this).find('input[name=name]').val();
        var host = $(this).find('input[name=host]').val();
        var protocol = $(this).find('input[name=protocol]').val();
        var port = $(this).find('input[name=port]').val();
        var grp = $(this).find('input[name=grp]').val();
        var emails = $(this).find('input[name=emails]').val();
        if( port == "3306" ) {
            alert("拒绝编辑<"+name+">，禁止对mysql数据库进行端口探测!");
            return 1;
        }

        if( name == "" || host == "" || protocol == "" || grp == "" || emails == ""){
            alert("存在字段为空，请重新输入！");
            return 1;
        } else {
            $.modal.close();
             $.ajax({
                url: '/services/' + id,
                method: 'PUT',
                data: service,
                success: function(resutl) {
                    if (resutl.auth === false) {
                        swal( '未登录或者token过期' + '失败', 'error');
                        loginDisplay()
                        return
                    }
                    swal({
                        title: 'Success',
                        text: '服务 "' + name + '" 修改成功',
                        type: 'success'
                    });
                    getServices();
                }
            });
        }

        $.modal.close();
         $.ajax({
            url: '/services/' + id,
            method: 'PUT',
            data: service,
            success: function(result) {
                if (result.auth === false) {
                    swal( '未登录或者token过期' + '失败', 'error');
                    loginDisplay()
                    return
                }
                swal({
                    title: 'Success',
                    text: '服务 "' + name + '" 修改成功',
                    type: 'success'
                });
                getServices();     
            }
        });
    });

    var refreshsec=sessionStorage.getItem("refreshsec");
    if(refreshsec == null || refreshsec == ""){
       refreshsec = 5
    }


    getServices();
    setInterval(getServices, refreshsec*1000);

    //导出节点列表
    $(document).on("click", "#export-list-button", function () {
        if (sessionStorage.getItem("token") === ""){
            swal( '未登录或者token过期' + '失败', 'error');
            loginDisplay()
            return
        }
        $.get('/services', function(services) {
            if (!services) {
                return;
            }
            var str = "服务名,协议,地址,端口,分组,通知邮件地址,状态,拼接字符串\r\n";
            for (var i in services) {
                var service = services[i];
                constr = service.name + "||"+service.protocol+"||"+service.host+"||"+(service.port ? service.port : 'null')+"||"+service.grp+"||"+service.emails
                str += service.name + ',' + service.protocol + ',' + service.host + ',' + (service.port ? service.port : 'null') + ',' + service.grp + ',' + service.emails + ',' + service.status + ',' + constr + "\r\n";
            }
            //var jscsv = "data:text/csv;charset=utf-8,\ufeff" + str.replace(/#/g,'"#"');
            var urlObject = window.URL || window.webkitURL || window;
            var link = document.createElement("a");
            var timestr = getTimestr();
            var export_blob = new Blob([str]);
            link.href = urlObject.createObjectURL(export_blob);
            link.download = "服务列表"+timestr+".txt";
            //link.setAttribute("href", jscsv);
            //link.setAttribute("download", "服务列表"+timestr+".csv");
            link.click();
        });
    });

    //下载批量添加模板
    $(document).on("click", "#download-template-button", function () {
        if (sessionStorage.getItem("token") === ""){
            swal( '未登录或者token过期' + '失败', 'error');
            loginDisplay()
            return
        }
        var link = document.createElement("a");
        link.setAttribute("href", "template.xls");
        link.setAttribute("download",  "template.xls");
        link.click();
    });

    //发送SMTP测试邮件
    $(document).on("click", "#smtp-test-button", function () {
        $.ajax({
            url: '/smtptest',
            method: 'POST',
            success: function(result) {
                if (result.auth === false) {
                    swal( '未登录或者token过期' + '失败', 'error');
                    loginDisplay()
                    return
                }
                swal({
                    title: 'Success',
                    text: '已提交发送SMTP测试邮件',
                    type: 'success'
                });
            }
        });
    });

    function change(t) {
        if (t < 10) {
            return "0" + t;
        } else {
            return t;
        }
    }


    function getTimestr() {
        var d = new Date();
        var year = d.getFullYear();
        var month = change(d.getMonth() + 1);
        var day = change(d.getDate());
        var hour = change(d.getHours());
        var minute = change(d.getMinutes());

        var time = year + month + day + hour + minute;
        return time;
    }

    function formatDatestr(datestr) {
        var d = new Date(datestr);
        var year = d.getFullYear();
        var month = change(d.getMonth() + 1);
        var day = change(d.getDate());
        var hour = change(d.getHours());
        var minute = change(d.getMinutes());

        var time = year + "-" + month + "-" + day + " " + hour + ":" + minute;
        return time;
    }

});

/*

    //导出节点列表
    $(document).on("click", "#export-list-button", function () {
        $.get('/services', function(services) {
            if (!services) {
                return;
            }
            var str = "服务名,协议,地址,端口,分组,通知邮件地址,状态,拼接字符串\r\n";
            for (var i in services) {
                var service = services[i];
                constr = service.name + "||"+service.protocol+"||"+service.host+"||"+(service.port ? service.port : 'null')+"||"+service.grp+"||"+service.emails
                str += service.name + ',' + service.protocol + ',' + service.host + ',' + (service.port ? service.port : 'null') + ',' + service.grp + ',' + service.emails + ',' + service.status + ',' + constr + "\r\n";
            }
            //var jscsv = "data:text/csv;charset=utf-8,\ufeff" + str.replace(/#/g,'"#"');
            var urlObject = window.URL || window.webkitURL || window;
            var link = document.createElement("a");
            var timestr = getTimestr();
            var export_blob = new Blob([str]);
            link.href = urlObject.createObjectURL(export_blob);
            link.download = "服务列表"+timestr+".txt";
            //link.setAttribute("href", jscsv);
            //link.setAttribute("download", "服务列表"+timestr+".csv");
            link.click();
        });
    });

    //下载批量添加模板
    $(document).on("click", "#download-template-button", function () {
        var link = document.createElement("a");
        link.setAttribute("href", "template.xls");
        link.setAttribute("download",  "template.xls");
        link.click();
    });

    //发送SMTP测试邮件
    $(document).on("click", "#smtp-test-button", function () {
         $.ajax({
            url: '/smtptest',
            method: 'POST',
            success: function() {
                swal({
                    title: 'Success',
                    text: '已提交发送SMTP测试邮件',
                    type: 'success'
                });
            }
        });
    });


    function ChangeGroup(){
        var group=$("#select-group").val();
        sessionStorage.setItem("group",group);
        window.location.reload();
    }


    function ChangeRefresh(){
        var refreshsec=$("#select-refresh").val();
        sessionStorage.setItem("refreshsec",refreshsec);
        window.location.reload();
    }



    function change(t) {
        if (t < 10) {
            return "0" + t;
        } else {
            return t;
        }
    }


    function getTimestr() {
      var d = new Date();
      var year = d.getFullYear();
      var month = change(d.getMonth() + 1);
      var day = change(d.getDate());
      var hour = change(d.getHours());
      var minute = change(d.getMinutes());

      var time = year + month + day + hour + minute;
      return time;
    }

    function formatDatestr(datestr) {
      var d = new Date(datestr);
      var year = d.getFullYear();
      var month = change(d.getMonth() + 1);
      var day = change(d.getDate());
      var hour = change(d.getHours());
      var minute = change(d.getMinutes());

      var time = year + "-" + month + "-" + day + " " + hour + ":" + minute;
      return time;
    }

*/

function ChangeGroup(){
    var group=$("#select-group").val();
    sessionStorage.setItem("group",group);
    window.location.reload();
}


function ChangeRefresh(){
    var refreshsec=$("#select-refresh").val();
    sessionStorage.setItem("refreshsec",refreshsec);
    window.location.reload();
}