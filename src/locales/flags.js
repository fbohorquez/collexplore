const flags = {
    "af": "flags/af.svg",
    "ax": "flags/ax.svg",
    "al": "flags/al.svg",
    "dz": "flags/dz.svg",
    "as": "flags/as.svg",
    "ad": "flags/ad.svg",
    "ao": "flags/ao.svg",
    "ai": "flags/ai.svg",
    "aq": "flags/aq.svg",
    "ag": "flags/ag.svg",
    "ar": "flags/ar.svg",
    "am": "flags/am.svg",
    "aw": "flags/aw.svg",
    "sh-ac": "flags/sh-ac.svg",
    "au": "flags/au.svg",
    "at": "flags/at.svg",
    "az": "flags/az.svg",
    "bs": "flags/bs.svg",
    "bh": "flags/bh.svg",
    "bd": "flags/bd.svg",
    "bb": "flags/bb.svg",
    "es-pv": "flags/es-pv.svg",
    "by": "flags/by.svg",
    "be": "flags/be.svg",
    "bz": "flags/bz.svg",
    "bj": "flags/bj.svg",
    "bm": "flags/bm.svg",
    "bt": "flags/bt.svg",
    "bo": "flags/bo.svg",
    "bq": "flags/bq.svg",
    "ba": "flags/ba.svg",
    "bw": "flags/bw.svg",
    "bv": "flags/bv.svg",
    "br": "flags/br.svg",
    "io": "flags/io.svg",
    "bn": "flags/bn.svg",
    "bg": "flags/bg.svg",
    "bf": "flags/bf.svg",
    "bi": "flags/bi.svg",
    "cv": "flags/cv.svg",
    "kh": "flags/kh.svg",
    "cm": "flags/cm.svg",
    "ca": "flags/ca.svg",
    "ic": "flags/ic.svg",
    "es-ct": "flags/es-ct.svg",
    "ky": "flags/ky.svg",
    "cf": "flags/cf.svg",
    "cefta": "flags/cefta.svg",
    "td": "flags/td.svg",
    "cl": "flags/cl.svg",
    "cn": "flags/cn.svg",
    "cx": "flags/cx.svg",
    "cp": "flags/cp.svg",
    "cc": "flags/cc.svg",
    "co": "flags/co.svg",
    "km": "flags/km.svg",
    "ck": "flags/ck.svg",
    "cr": "flags/cr.svg",
    "hr": "flags/hr.svg",
    "cu": "flags/cu.svg",
    "cw": "flags/cw.svg",
    "cy": "flags/cy.svg",
    "cz": "flags/cz.svg",
    "ci": "flags/ci.svg",
    "cd": "flags/cd.svg",
    "dk": "flags/dk.svg",
    "dg": "flags/dg.svg",
    "dj": "flags/dj.svg",
    "dm": "flags/dm.svg",
    "do": "flags/do.svg",
    "eac": "flags/eac.svg",
    "ec": "flags/ec.svg",
    "eg": "flags/eg.svg",
    "sv": "flags/sv.svg",
    "gb-eng": "flags/gb-eng.svg",
    "gq": "flags/gq.svg",
    "er": "flags/er.svg",
    "ee": "flags/ee.svg",
    "sz": "flags/sz.svg",
    "et": "flags/et.svg",
    "eu": "flags/eu.svg",
    "fk": "flags/fk.svg",
    "fo": "flags/fo.svg",
    "fm": "flags/fm.svg",
    "fj": "flags/fj.svg",
    "fi": "flags/fi.svg",
    "fr": "flags/fr.svg",
    "gf": "flags/gf.svg",
    "pf": "flags/pf.svg",
    "tf": "flags/tf.svg",
    "ga": "flags/ga.svg",
    "es-ga": "flags/es-ga.svg",
    "gm": "flags/gm.svg",
    "ge": "flags/ge.svg",
    "de": "flags/de.svg",
    "gh": "flags/gh.svg",
    "gi": "flags/gi.svg",
    "gr": "flags/gr.svg",
    "gl": "flags/gl.svg",
    "gd": "flags/gd.svg",
    "gp": "flags/gp.svg",
    "gu": "flags/gu.svg",
    "gt": "flags/gt.svg",
    "gg": "flags/gg.svg",
    "gn": "flags/gn.svg",
    "gw": "flags/gw.svg",
    "gy": "flags/gy.svg",
    "ht": "flags/ht.svg",
    "hm": "flags/hm.svg",
    "va": "flags/va.svg",
    "hn": "flags/hn.svg",
    "hk": "flags/hk.svg",
    "hu": "flags/hu.svg",
    "is": "flags/is.svg",
    "in": "flags/in.svg",
    "id": "flags/id.svg",
    "ir": "flags/ir.svg",
    "iq": "flags/iq.svg",
    "ie": "flags/ie.svg",
    "im": "flags/im.svg",
    "il": "flags/il.svg",
    "it": "flags/it.svg",
    "jm": "flags/jm.svg",
    "jp": "flags/jp.svg",
    "je": "flags/je.svg",
    "jo": "flags/jo.svg",
    "kz": "flags/kz.svg",
    "ke": "flags/ke.svg",
    "ki": "flags/ki.svg",
    "xk": "flags/xk.svg",
    "kw": "flags/kw.svg",
    "kg": "flags/kg.svg",
    "la": "flags/la.svg",
    "lv": "flags/lv.svg",
    "arab": "flags/arab.svg",
    "lb": "flags/lb.svg",
    "ls": "flags/ls.svg",
    "lr": "flags/lr.svg",
    "ly": "flags/ly.svg",
    "li": "flags/li.svg",
    "lt": "flags/lt.svg",
    "lu": "flags/lu.svg",
    "mo": "flags/mo.svg",
    "mg": "flags/mg.svg",
    "mw": "flags/mw.svg",
    "my": "flags/my.svg",
    "mv": "flags/mv.svg",
    "ml": "flags/ml.svg",
    "mt": "flags/mt.svg",
    "mh": "flags/mh.svg",
    "mq": "flags/mq.svg",
    "mr": "flags/mr.svg",
    "mu": "flags/mu.svg",
    "yt": "flags/yt.svg",
    "mx": "flags/mx.svg",
    "md": "flags/md.svg",
    "mc": "flags/mc.svg",
    "mn": "flags/mn.svg",
    "me": "flags/me.svg",
    "ms": "flags/ms.svg",
    "ma": "flags/ma.svg",
    "mz": "flags/mz.svg",
    "mm": "flags/mm.svg",
    "na": "flags/na.svg",
    "nr": "flags/nr.svg",
    "np": "flags/np.svg",
    "nl": "flags/nl.svg",
    "nc": "flags/nc.svg",
    "nz": "flags/nz.svg",
    "ni": "flags/ni.svg",
    "ne": "flags/ne.svg",
    "ng": "flags/ng.svg",
    "nu": "flags/nu.svg",
    "nf": "flags/nf.svg",
    "kp": "flags/kp.svg",
    "mk": "flags/mk.svg",
    "gb-nir": "flags/gb-nir.svg",
    "mp": "flags/mp.svg",
    "no": "flags/no.svg",
    "om": "flags/om.svg",
    "pc": "flags/pc.svg",
    "pk": "flags/pk.svg",
    "pw": "flags/pw.svg",
    "pa": "flags/pa.svg",
    "pg": "flags/pg.svg",
    "py": "flags/py.svg",
    "pe": "flags/pe.svg",
    "ph": "flags/ph.svg",
    "pn": "flags/pn.svg",
    "pl": "flags/pl.svg",
    "pt": "flags/pt.svg",
    "pr": "flags/pr.svg",
    "qa": "flags/qa.svg",
    "cg": "flags/cg.svg",
    "ro": "flags/ro.svg",
    "ru": "flags/ru.svg",
    "rw": "flags/rw.svg",
    "re": "flags/re.svg",
    "bl": "flags/bl.svg",
    "sh-hl": "flags/sh-hl.svg",
    "sh": "flags/sh.svg",
    "kn": "flags/kn.svg",
    "lc": "flags/lc.svg",
    "mf": "flags/mf.svg",
    "pm": "flags/pm.svg",
    "vc": "flags/vc.svg",
    "ws": "flags/ws.svg",
    "sm": "flags/sm.svg",
    "st": "flags/st.svg",
    "sa": "flags/sa.svg",
    "gb-sct": "flags/gb-sct.svg",
    "sn": "flags/sn.svg",
    "rs": "flags/rs.svg",
    "sc": "flags/sc.svg",
    "sl": "flags/sl.svg",
    "sg": "flags/sg.svg",
    "sx": "flags/sx.svg",
    "sk": "flags/sk.svg",
    "si": "flags/si.svg",
    "sb": "flags/sb.svg",
    "so": "flags/so.svg",
    "za": "flags/za.svg",
    "gs": "flags/gs.svg",
    "kr": "flags/kr.svg",
    "ss": "flags/ss.svg",
    "es": "flags/es.svg",
    "lk": "flags/lk.svg",
    "ps": "flags/ps.svg",
    "sd": "flags/sd.svg",
    "sr": "flags/sr.svg",
    "sj": "flags/sj.svg",
    "se": "flags/se.svg",
    "ch": "flags/ch.svg",
    "sy": "flags/sy.svg",
    "tw": "flags/tw.svg",
    "tj": "flags/tj.svg",
    "tz": "flags/tz.svg",
    "th": "flags/th.svg",
    "tl": "flags/tl.svg",
    "tg": "flags/tg.svg",
    "tk": "flags/tk.svg",
    "to": "flags/to.svg",
    "tt": "flags/tt.svg",
    "sh-ta": "flags/sh-ta.svg",
    "tn": "flags/tn.svg",
    "tm": "flags/tm.svg",
    "tc": "flags/tc.svg",
    "tv": "flags/tv.svg",
    "tr": "flags/tr.svg",
    "ug": "flags/ug.svg",
    "ua": "flags/ua.svg",
    "ae": "flags/ae.svg",
    "gb": "flags/gb.svg",
    "un": "flags/un.svg",
    "um": "flags/um.svg",
    "us": "flags/us.svg",
    "xx": "flags/xx.svg",
    "uy": "flags/uy.svg",
    "uz": "flags/uz.svg",
    "vu": "flags/vu.svg",
    "ve": "flags/ve.svg",
    "vn": "flags/vn.svg",
    "vg": "flags/vg.svg",
    "vi": "flags/vi.svg",
    "gb-wls": "flags/gb-wls.svg",
    "wf": "flags/wf.svg",
    "eh": "flags/eh.svg",
    "ye": "flags/ye.svg",
    "zm": "flags/zm.svg",
    "zw": "flags/zw.svg"
};

export default flags;