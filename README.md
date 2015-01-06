ionic-ion-airbnbmenu
====================
author: @mamged
using this ion you can extend your application menu to look like airbnb mobile app menu<br>
<h1>usage</h1>
just name your app module with app
<h3>example</h3>
<code>
var app = angular.module('starter', ['ionic', 'starter.controllers'])
</code><br>
<h3>css</h3>
also you need to add this code to your css<br>
<pre>
.inactive {
    cursor: pointer;
    -webkit-transform: translate3d(160px, 0px, 0px) scale(0.5);
    -moz-transform: translate3d(160px, 0px, 0px) scale(0.5);
    -ms-transform: translate3d(160px, 0px, 0px) scale(0.5);
    transform: translate3d(160px, 0px, 0px) scale(0.5);
}
.menu {
    -webkit-transition: all 300ms ease-in-out;
    -moz-transition: all 300ms ease-in-out;
    -ms-transition: all 300ms ease-in-out;
    -o-transition: all 300ms ease-in-out;
    transition: all 300ms ease-in-out;
    -webkit-backface-visibility: hidden;
}
.menu.menu-left{
	transition: all 300ms ease-in-out;
}
.menu.menu-left .list {
    transition: all 300ms ease-in-out;
    transform: scale(.2);
}
.menu.menu-left.active{
	top: 110px;
}
.menu.menu-left.active .list{
	transform: scale(1);
}
.menu.menu-left.active {
    top: 110px;
    left: 40px;
}
</pre>
