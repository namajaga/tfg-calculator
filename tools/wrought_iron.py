BLOOMERY_MAX = 48

IRON_DUST_ML = 129
IRON_SMALL_DUST_ML = 31
IRON_TINY_DUST_ML = 13


def case_bloomery(dust, small, tiny):
    # ------------------------- calc ------------------------- #
    iron_ml = dust * IRON_DUST_ML + small * IRON_SMALL_DUST_ML + tiny * IRON_TINY_DUST_ML
    result_ingot = iron_ml // 144
    result_ingot_mod = iron_ml % 144
    coal = result_ingot
    item_count = coal + dust + small + tiny
    bloomery_diff = BLOOMERY_MAX - item_count

    is_bloomery_full = item_count >= BLOOMERY_MAX
    # -------------------------------------------------------- #

    # print(f"Dust:\t{dust}")
    # print(f"Small:\t{small}")
    # print(f"Tiny:\t{tiny}")
    # print(f"Coal:\t{coal}")
    # print("-----------------------------")
    # print(f"Iron (ml):\t{iron_ml}")
    # print(f"Result Ingot:\t{result_ingot}...{result_ingot_mod}")

    # print()
    # print(f"Item Count:\t{item_count} / {BLOOMERY_MAX}    ({bloomery_diff})")
    if not is_bloomery_full:
        if result_ingot_mod == 0:
            print(f"{bloomery_diff}\t{(dust, small, tiny)} Coal:{coal} -> {result_ingot}...{result_ingot_mod}")


for i in range(40):
    for j in range(40):
        for k in range(40):
            case_bloomery(i, j, k)
