extends Node


# Called when the node enters the scene tree for the first time.
func _ready():
	var test_spaces   =   "extra spaces were there"


# Called every frame. 'delta' is the elapsed time since the previous frame.
func _process(_delta):
	var test1 = "test"  # Colisão à esquerda
	var languages_mapping: Array[Dictionary] = [
		{"id": 0, "code": "en", "label": "English"},
		{"id": 1, "code": "ru", "label": "Русский"}
	]