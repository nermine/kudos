jQuery(document).ready(function(){
	jQuery('.tipso').tipso({
		speed       : parseInt(tipsoData.speed),
        background  : tipsoData.background,
        color       : tipsoData.color,
        position    : tipsoData.position,
        width       : parseInt(tipsoData.width),
        delay       : parseInt(tipsoData.delay),
        useTitle	: false
	});
});