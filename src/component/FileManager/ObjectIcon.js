import React, { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
    changeContextMenu,
    setSelectedTarget,
    addSelectedTarget,
    removeSelectedTarget,
    navitateTo,
    showImgPreivew,
    openMusicDialog,
    toggleSnackbar,
    dragAndDrop,
    openLoadingDialog
} from "../../actions/index";
import statusHelper from "../../untils/page";
import FileIcon from "./FileIcon";
import SmallIcon from "./SmallIcon";
import TableItem from "./TableRow";
import classNames from "classnames";
import { isPreviewable } from "../../config";
import { makeStyles } from "@material-ui/core";
import { useDrag } from "react-dnd";
import { getEmptyImage } from "react-dnd-html5-backend";
import DropWarpper from "./DnD/DropWarpper";
import { useHistory, useLocation } from "react-router-dom";
import Auth from "../../middleware/Auth";
import { pathBack } from "../../untils";

const useStyles = makeStyles(theme => ({
    container: {
        padding: "7px"
    },
    fixFlex: {
        minWidth: 0
    },
    dragging: {
        opacity: 0.4
    }
}));

export default function ObjectIcon(props) {
    const path = useSelector(state => state.navigator.path);
    const selected = useSelector(state => state.explorer.selected);
    const viewMethod = useSelector(
        state => state.viewUpdate.explorerViewMethod
    );
    const navigatorPath = useSelector(state => state.navigator.path);
    let location = useLocation();
    let history = useHistory();

    const dispatch = useDispatch();
    const ContextMenu = useCallback(
        (type, open) => dispatch(changeContextMenu(type, open)),
        [dispatch]
    );
    const SetSelectedTarget = useCallback(
        targets => dispatch(setSelectedTarget(targets)),
        [dispatch]
    );
    const AddSelectedTarget = useCallback(
        targets => dispatch(addSelectedTarget(targets)),
        [dispatch]
    );
    const RemoveSelectedTarget = useCallback(
        id => dispatch(removeSelectedTarget(id)),
        [dispatch]
    );
    const NavitateTo = useCallback(targets => dispatch(navitateTo(targets)), [
        dispatch
    ]);
    const ShowImgPreivew = useCallback(
        targets => dispatch(showImgPreivew(targets)),
        [dispatch]
    );
    const OpenMusicDialog = useCallback(() => dispatch(openMusicDialog()), [
        dispatch
    ]);
    const ToggleSnackbar = useCallback(
        (vertical, horizontal, msg, color) =>
            dispatch(toggleSnackbar(vertical, horizontal, msg, color)),
        [dispatch]
    );
    const DragAndDrop = useCallback(
        (source, target) => dispatch(dragAndDrop(source, target)),
        [dispatch]
    );
    const OpenLoadingDialog = useCallback(
        text => dispatch(openLoadingDialog(text)),
        [dispatch]
    );

    const classes = useStyles();

    const contextMenu = e => {
        if (props.file.type === "up") {
            return;
        }
        e.preventDefault();
        if (
            selected.findIndex(value => {
                return value === props.file;
            }) === -1
        ) {
            SetSelectedTarget([props.file]);
        }
        ContextMenu("file", true);
    };

    const selectFile = e => {
        let presentIndex = selected.findIndex(value => {
            return value === props.file;
        });
        if (presentIndex !== -1 && e.ctrlKey) {
            RemoveSelectedTarget(presentIndex);
        } else {
            if (e.ctrlKey) {
                AddSelectedTarget(props.file);
            } else {
                SetSelectedTarget([props.file]);
            }
        }
    };

    const handleClick = e => {
        if (props.file.type === "up") {
            NavitateTo(pathBack(navigatorPath));
        }
        if (
            statusHelper.isMobile() ||
            statusHelper.isSharePage(location.pathname)
        ) {
            selectFile(e);
            if (props.file.type === "dir" && !e.ctrlKey) {
                enterFolder();
                return;
            }
        } else {
            selectFile(e);
        }
    };

    const handleDoubleClick = () => {
        if (props.file.type === "up") {
            return;
        }
        if (props.file.type === "dir") {
            enterFolder();
            return;
        }
        let isShare = statusHelper.isSharePage(location.pathname);
        if (isShare) {
            let user = Auth.GetUser();
            if (!Auth.Check() && user && !user.group.shareDownload) {
                ToggleSnackbar("top", "right", "请先登录", "warning");
                return;
            }
        }
        if (window.shareInfo && !window.shareInfo.preview) {
            OpenLoadingDialog("获取下载地址...");
            return;
        }
        let previewPath =
            selected[0].path === "/"
                ? selected[0].path + selected[0].name
                : selected[0].path + "/" + selected[0].name;
        switch (isPreviewable(selected[0].name)) {
            case "img":
                ShowImgPreivew(selected[0]);
                return;
            case "msDoc":
                if (isShare) {
                    history.push(
                        selected[0].key +
                            "/doc?name=" +
                            encodeURIComponent(selected[0].name) +
                            "&share_path=" +
                            encodeURIComponent(previewPath)
                    );
                    return;
                }
                history.push(
                    "/doc" +
                    previewPath +
                        "?id=" +
                        selected[0].id
                );
                return;
            case "audio":
                OpenMusicDialog();
                return;
            case "video":
                if (isShare) {
                    history.push(
                        selected[0].key +
                            "/video?name=" +
                            encodeURIComponent(selected[0].name) +
                            "&share_path=" +
                            encodeURIComponent(previewPath)
                    );
                    return;
                }
                history.push(
                    "/video" +
                    previewPath +
                    "?id=" +
                    selected[0].id
                );
                return;
            case "edit":
                if (isShare) {
                    history.push(
                        selected[0].key +
                            "/text?name=" +
                            encodeURIComponent(selected[0].name) +
                            "&share_path=" +
                            encodeURIComponent(previewPath)
                    );
                    return;
                }
                history.push("/text" + previewPath + "?id=" + selected[0].id);
                return;
            default:
                OpenLoadingDialog("获取下载地址...");
                return;
        }
    };

    const enterFolder = () => {
        NavitateTo(
            path === "/" ? path + props.file.name : path + "/" + props.file.name
        );
    };

    const [{ isDragging }, drag, preview] = useDrag({
        item: {
            object: props.file,
            type: "object",
            selected: [...selected],
            viewMethod: viewMethod
        },
        end: (item, monitor) => {
            const dropResult = monitor.getDropResult();
            if (item && dropResult) {
                if (dropResult.folder) {
                    if (
                        item.object.id !== dropResult.folder.id ||
                        item.object.type !== dropResult.folder.type
                    ) {
                        DragAndDrop(item.object, dropResult.folder);
                    }
                }
            }
        },
        canDrag: () => {
            return (
                !statusHelper.isMobile() &&
                statusHelper.isHomePage(location.pathname)
            );
        },
        collect: monitor => ({
            isDragging: monitor.isDragging()
        })
    });

    useEffect(() => {
        preview(getEmptyImage(), { captureDraggingState: true });
        // eslint-disable-next-line
    }, []);

    if (viewMethod === "list") {
        return (
            <TableItem
                contextMenu={contextMenu}
                handleClick={handleClick}
                handleDoubleClick={handleDoubleClick.bind(this)}
                file={props.file}
            />
        );
    }

    return (
        <div
            ref={drag}
            className={classNames({
                [classes.container]: viewMethod !== "list",
                [classes.dragging]: isDragging
            })}
        >
            <div
                className={classes.fixFlex}
                onContextMenu={contextMenu}
                onClick={handleClick}
                onDoubleClick={handleDoubleClick.bind(this)}
            >
                {props.file.type === "dir" && viewMethod !== "list" && (
                    <DropWarpper folder={props.file} />
                )}
                {props.file.type === "file" && viewMethod === "icon" && (
                    <FileIcon ref={drag} file={props.file} />
                )}
                {props.file.type === "file" && viewMethod === "smallIcon" && (
                    <SmallIcon file={props.file} />
                )}
            </div>
        </div>
    );
}
