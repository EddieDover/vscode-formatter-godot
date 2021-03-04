extends Control


func _translations() -> void:
	$TitleFarm.bbcode_text = tr("UI_FARM")


func _ready() -> void:
	_translations()
	_onMoneyChanged(Global.gameState.money)
	_updateUI()
	# connect signals
	var _ret = Global.connect("moneyAmountChanged", self, "_onMoneyChanged")
	_ret = Global.connect("gameStateChanged", self, "_onGameStateChanged")


func _onMoneyChanged(money):
	var str_money = str(money)
	$NumberOfCoins.bbcode_text = "[center]" + str_money + "[/center]"


func _updateGieskanne(node: TextureProgress) -> void:
	node.value = Global.gameState.watercanFuel
	node.max_value = Global.gameState.maxWatercanFuel


func _updateUI() -> void:
	_updateGieskanne($"WerkzeugSelect/GieskanneFülle")
	_updateGieskanne($"WerkzeugSelect/Werkzeug1/GieskanneFülle")
	_updateGieskanne($"WerkzeugSelect/Werkzeug2/GieskanneFülle")
	_updateGieskanne($"WerkzeugSelect/Werkzeug3/GieskanneFülle")
	_updateGieskanne($"WerkzeugSelect/Werkzeug4/GieskanneFülle")


func _onGameStateChanged() -> void:
	_updateUI()
	_onMoneyChanged(Global.gameState.money)


func setWerkzeugFromSlot(slot: int, node: TextureRect) -> void:
	if Global.gameState.quickselect_tool.length <= slot:
		return
	if Global.gameState.quickselect_tool[slot] == Global.tools.NIX:
		return

	node.texture = Global.items[Global.gameState.quickselect_tool[slot]].icon


func _toolExtend_pressed() -> void:
	setWerkzeugFromSlot(0, $WerkzeugExtend/Werkzeug1/Werkzeug)
	setWerkzeugFromSlot(1, $WerkzeugExtend/Werkzeug2/Werkzeug)
	setWerkzeugFromSlot(2, $WerkzeugExtend/Werkzeug3/Werkzeug)
	setWerkzeugFromSlot(3, $WerkzeugExtend/Werkzeug4/Werkzeug)
	$WerkzeugExtend.visible = true


func _Werkzeug1_pressed() -> void:
	pass
